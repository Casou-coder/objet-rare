import { randomUUID } from 'crypto';
import {
  attachCertificate,
  auth,
  completeProfile,
  readableCertificate,
  setupApp,
  unreadableCertificate,
  watchPayload,
  type TestCtx,
} from '../helpers';

let ctx: TestCtx;

const fakeOcr = {
  async extract() {
    return { holder_name: 'DUPONT Jean', serial_number: 'OCR123', brand: 'Rolex' };
  },
};

beforeAll(async () => {
  ctx = await setupApp({ ocr: fakeOcr });
});
afterAll(async () => {
  await ctx.app.close();
  await ctx.ds.destroy();
});

async function createWatch(uid: string, serial: string, extra: Record<string, unknown> = {}) {
  const id = randomUUID();
  const conf = await attachCertificate(ctx, uid, id);
  expect(conf.status).toBe(200);
  return ctx.http().post('/items').set(auth(uid)).send(watchPayload(id, serial, extra));
}

describe('authentification et profil', () => {
  it('refuse sans jeton (401 UNAUTHORIZED)', async () => {
    const r = await ctx.http().get('/me');
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
  });

  it('crée le profil au premier appel, nom obligatoire avant tout ajout', async () => {
    const me = await ctx.http().get('/me').set(auth('u-profile')).expect(200);
    expect(me.body.plan).toBe('free');
    expect(me.body.profile_complete).toBe(false);
    const up = await ctx.http().post(`/items/${randomUUID()}/certificate/upload-url`).set(auth('u-profile'))
      .send({ content_type: 'image/png', size_bytes: 10 });
    expect(up.status).toBe(403);
    expect(up.body.error.details.reason).toBe('PROFILE_INCOMPLETE');
    await completeProfile(ctx, 'u-profile');
    const me2 = await ctx.http().get('/me').set(auth('u-profile')).expect(200);
    expect(me2.body.full_name).toBe('Jean Dupont');
    expect(me2.body.limits.free_item_limit).toBe(3);
  });
});

describe('création d’un objet', () => {
  beforeAll(async () => {
    for (const u of ['alice', 'bob']) await completeProfile(ctx, u);
  });

  it('crée un objet avec certificat lisible, préremplissage OCR et statuts de preuve', async () => {
    const id = randomUUID();
    const conf = await attachCertificate(ctx, 'alice', id);
    expect(conf.status).toBe(200);
    expect(conf.body.readability_score).toBeGreaterThanOrEqual(65);
    expect(conf.body.extraction.serial_number).toBe('OCR123');
    expect(conf.body.holder_match).toBe('match');
    expect(conf.body.extraction.holder_name).toBeUndefined();

    const r = await ctx.http().post('/items').set(auth('alice')).send(watchPayload(id, 'AB-12 34', { acquisition_date: '2024-03-01' }));
    expect(r.status).toBe(201);
    expect(r.body.id).toBe(id);
    expect(r.body.acquisition_date).toBe('2024-03-01');
    expect(r.body.unique_id).toEqual({ type: 'serial_number', value: 'AB-12 34' });
    expect(r.body.proof_status).toEqual(
      expect.arrayContaining(['certificate_provided', 'readability_sufficient', 'holder_confirmed', 'unique_id_registered']),
    );
    expect(JSON.stringify(r.body)).not.toMatch(/authentif/i);

    const cert = await ctx.http().get(`/items/${id}/certificate`).set(auth('alice')).expect(200);
    expect(cert.body.view_url).toMatch(/^memory:\/\/view\//);
    expect(cert.body.watermark).toBe(true);
  });

  it('refuse un objet sans certificat (400)', async () => {
    const r = await ctx.http().post('/items').set(auth('alice')).send(watchPayload(randomUUID(), 'NOCERT'));
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('refuse un certificat illisible (422) puis accepte un nouveau scan', async () => {
    const id = randomUUID();
    const bad = await attachCertificate(ctx, 'alice', id, await unreadableCertificate());
    expect(bad.status).toBe(422);
    expect(bad.body.error.code).toBe('CERTIFICATE_NOT_READABLE');
    expect(bad.body.error.message).toBe('Ce document n’est pas suffisamment lisible.');
    const creating = await ctx.http().post('/items').set(auth('alice')).send(watchPayload(id, 'RESCAN'));
    expect(creating.status).toBe(400);
    const good = await attachCertificate(ctx, 'alice', id);
    expect(good.status).toBe(200);
  });

  it('bloque un certificat déjà utilisé, tous utilisateurs confondus (409 neutre)', async () => {
    const file = await readableCertificate('PARTAGE');
    const a = randomUUID();
    await attachCertificate(ctx, 'alice', a, file);
    await ctx.http().post('/items').set(auth('alice')).send(watchPayload(a, 'DUPHASH-A')).expect(201);
    const r = await attachCertificate(ctx, 'bob', randomUUID(), file);
    expect(r.status).toBe(409);
    expect(r.body.error).toEqual({ code: 'DUPLICATE_CERTIFICATE', message: 'Ce certificat est déjà associé à un objet existant.' });
  });

  it('bloque un identifiant déjà enregistré, enregistre le conflit, ne révèle rien de l’autre utilisateur', async () => {
    const r = await createWatch('bob', 'ab 1234'); // même identifiant normalisé que « AB-12 34 »
    expect(r.status).toBe(409);
    expect(r.body.error).toEqual({ code: 'UNIQUE_ID_CONFLICT', message: 'Un conflit d’unicité a été détecté.' });
    const conflicts = await ctx.ds.query("select * from conflicts where unique_id_value = 'AB1234'");
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].existing_item_id).toBeTruthy();
    expect(conflicts[0].attempt_payload).toEqual({ category: 'watch', brand: 'Rolex', model: 'Submariner' });
    const bobItems = await ctx.http().get('/items').set(auth('bob')).expect(200);
    expect(bobItems.body.items).toHaveLength(0);
  });

  it('n’autorise pas à remplacer le certificat d’un objet existant', async () => {
    const r = await createWatch('alice', 'IMMUTABLE-1');
    expect(r.status).toBe(201);
    const up = await ctx.http().post(`/items/${r.body.id}/certificate/upload-url`).set(auth('alice'))
      .send({ content_type: 'image/png', size_bytes: 10 });
    expect(up.status).toBe(403);
  });
});

describe('lecture, modification et isolation', () => {
  let itemId: string;
  beforeAll(async () => {
    await completeProfile(ctx, 'carol');
    const r = await createWatch('carol', 'CAROL-1');
    itemId = r.body.id;
  });

  it('Ma collection ne charge que image, nom et date', async () => {
    const r = await ctx.http().get('/items?view=collection').set(auth('carol')).expect(200);
    expect(Object.keys(r.body.items[0]).sort()).toEqual(['created_at', 'id', 'name', 'primary_image_url']);
  });

  it('Mon coffre expose valeur indicative et statut documentaire', async () => {
    const r = await ctx.http().get('/items?view=vault').set(auth('carol')).expect(200);
    expect(r.body.items[0]).toMatchObject({ indicative_market_value: null, document_status: 'complete' });
  });

  it('PATCH est toujours refusé (décision P5)', async () => {
    const r = await ctx.http().patch(`/items/${itemId}`).set(auth('carol')).send({ model: 'X' });
    expect(r.status).toBe(403);
    expect(r.body.error.details.reason).toBe('ITEM_IMMUTABLE');
  });

  it('un autre utilisateur reçoit 404 (jamais 403)', async () => {
    await ctx.http().get(`/items/${itemId}`).set(auth('alice')).expect(404);
    await ctx.http().patch(`/items/${itemId}`).set(auth('alice')).expect(404);
    await ctx.http().delete(`/items/${itemId}`).set(auth('alice')).send({ reason: 'sold' }).expect(404);
    await ctx.http().get(`/items/${itemId}/certificate`).set(auth('alice')).expect(404);
  });

  it('identifiant non UUID → 400', async () => {
    const r = await ctx.http().get('/items/abc').set(auth('carol'));
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('valeur indisponible puis rafraîchissement asynchrone (202)', async () => {
    const v = await ctx.http().get(`/items/${itemId}/value`).set(auth('carol')).expect(200);
    expect(v.body.value_amount).toBeNull();
    expect(v.body.disclaimer).toMatch(/indicative/);
    await ctx.http().post(`/items/${itemId}/value/refresh`).set(auth('carol')).expect(202);
  });

  it('historique limité aux 6 derniers points en Free, complet en Premium', async () => {
    for (let d = 1; d <= 9; d++) {
      await ctx.ds.query(
        "insert into value_timeseries (item_id, as_of_date, value_amount, currency, source) values ($1, $2, $3, 'EUR', 'test')",
        [itemId, `2026-0${d}-01`, 1000 + d],
      );
    }
    const free = await ctx.http().get(`/items/${itemId}/value/timeseries`).set(auth('carol')).expect(200);
    expect(free.body.points).toHaveLength(6);
    expect(free.body.limited).toBe(true);
    expect(free.body.points[5].as_of_date).toBe('2026-09-01');
    await ctx.ds.query("update users set plan = 'premium' where auth_uid = 'carol'");
    const prem = await ctx.http().get(`/items/${itemId}/value/timeseries`).set(auth('carol')).expect(200);
    expect(prem.body.points).toHaveLength(9);
    await ctx.ds.query("update users set plan = 'free' where auth_uid = 'carol'");
  });
});

describe('limite Free : 3 objets, non contournable', () => {
  beforeAll(() => completeProfile(ctx, 'dave'));

  it('bloque le 4e objet (402)', async () => {
    for (let i = 1; i <= 3; i++) expect((await createWatch('dave', `DAVE-${i}`)).status).toBe(201);
    const r = await ctx.http().post(`/items/${randomUUID()}/certificate/upload-url`).set(auth('dave'))
      .send({ content_type: 'image/png', size_bytes: 10 });
    expect(r.status).toBe(402);
    expect(r.body.error.code).toBe('FREE_LIMIT_REACHED');
  });

  it('résiste aux créations simultanées', async () => {
    await completeProfile(ctx, 'erin');
    expect((await createWatch('erin', 'ERIN-1')).status).toBe(201);
    expect((await createWatch('erin', 'ERIN-2')).status).toBe(201);
    const drafts = [randomUUID(), randomUUID(), randomUUID()];
    for (const d of drafts) expect((await attachCertificate(ctx, 'erin', d)).status).toBe(200);
    const results = await Promise.all(
      drafts.map((d, i) => ctx.http().post('/items').set(auth('erin')).send(watchPayload(d, `ERIN-P${i}`))),
    );
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(results.filter((r) => r.status === 402)).toHaveLength(2);
    const [{ n }] = await ctx.ds.query("select count(*)::int as n from items i join users u on u.id = i.user_id where u.auth_uid = 'erin'");
    expect(n).toBe(3);
  });

  it('Premium : objets illimités', async () => {
    await ctx.ds.query("update users set plan = 'premium' where auth_uid = 'dave'");
    expect((await createWatch('dave', 'DAVE-4')).status).toBe(201);
  });
});
