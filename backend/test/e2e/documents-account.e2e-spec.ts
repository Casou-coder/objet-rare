import { randomUUID } from 'crypto';
import {
  attachCertificate,
  auth,
  completeProfile,
  readableCertificate,
  setupApp,
  watchPayload,
  type TestCtx,
} from '../helpers';

let ctx: TestCtx;

beforeAll(async () => {
  ctx = await setupApp();
});
afterAll(async () => {
  await ctx.app.close();
  await ctx.ds.destroy();
});

async function newItem(uid: string, serial: string, withPhoto = false): Promise<string> {
  const id = randomUUID();
  expect((await attachCertificate(ctx, uid, id)).status).toBe(200);
  let extra: Record<string, unknown> = {};
  if (withPhoto) {
    const p = await ctx.http().post(`/items/${id}/photo/upload-url`).set(auth(uid)).send({ content_type: 'image/jpeg', size_bytes: 100 });
    expect(p.status).toBe(201);
    ctx.storage.put(p.body.upload_key, Buffer.from('photo-bytes'), 'image/jpeg');
    extra = { cover_photo_upload_key: p.body.upload_key };
  }
  const r = await ctx.http().post('/items').set(auth(uid)).send(watchPayload(id, serial, extra));
  expect(r.status).toBe(201);
  return id;
}

async function addDoc(uid: string, itemId: string, type: string, file?: Buffer) {
  const up = await ctx.http().post(`/items/${itemId}/documents/upload-url`).set(auth(uid)).send({ content_type: 'application/pdf', size_bytes: 100 });
  expect(up.status).toBe(201);
  ctx.storage.put(up.body.upload_key, file ?? Buffer.from(`doc-${randomUUID()}`), 'application/pdf');
  return ctx.http().post(`/items/${itemId}/documents/confirm`).set(auth(uid)).send({ upload_key: up.body.upload_key, type });
}

describe('documents liés', () => {
  let item: string;
  beforeAll(async () => {
    await completeProfile(ctx, 'frank');
    item = await newItem('frank', 'FRANK-1');
  });

  it('Free : 1 assurance par objet, aucun autre document (P4)', async () => {
    expect((await addDoc('frank', item, 'insurance')).status).toBe(200);
    const second = await addDoc('frank', item, 'insurance');
    expect(second.status).toBe(402);
    expect(second.body.error.code).toBe('FREE_LIMIT_REACHED');
    expect((await addDoc('frank', item, 'invoice')).status).toBe(402);
    const list = await ctx.http().get(`/items/${item}/documents`).set(auth('frank')).expect(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].view_url).toBeTruthy();
  });

  it('Premium : documents illimités ; après résiliation, les données restent mais l’accès est restreint', async () => {
    await ctx.ds.query("update users set plan = 'premium' where auth_uid = 'frank'");
    expect((await addDoc('frank', item, 'invoice')).status).toBe(200);
    expect((await addDoc('frank', item, 'insurance')).status).toBe(200);
    await ctx.ds.query("update users set plan = 'free' where auth_uid = 'frank'");
    const list = await ctx.http().get(`/items/${item}/documents`).set(auth('frank')).expect(200);
    expect(list.body.items).toHaveLength(3);
    expect(list.body.items.filter((d: { locked: boolean }) => !d.locked)).toHaveLength(1);
    expect(list.body.items.filter((d: { view_url: string | null }) => d.view_url === null)).toHaveLength(2);
  });

  it('un même fichier ne peut jamais être importé deux fois', async () => {
    await completeProfile(ctx, 'gina');
    const other = await newItem('gina', 'GINA-1');
    const file = Buffer.from('fichier-unique-assurance');
    expect((await addDoc('gina', other, 'insurance', file)).status).toBe(200);
    const again = await addDoc('frank', await newItem('frank', 'FRANK-2'), 'insurance', file);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('DUPLICATE_CERTIFICATE');
  });

  it('refuse une clé de téléversement d’un autre objet', async () => {
    const r = await ctx.http().post(`/items/${item}/documents/confirm`).set(auth('frank'))
      .send({ upload_key: 'users/x/items/y/documents/z', type: 'insurance' });
    expect(r.status).toBe(400);
  });

  it('page Documents : certificats puis assurances', async () => {
    const r = await ctx.http().get('/documents').set(auth('gina')).expect(200);
    expect(r.body.certificates).toHaveLength(1);
    expect(r.body.insurances).toHaveLength(1);
  });
});

describe('suppression d’un objet : purge totale', () => {
  it('exige une raison, puis supprime fichiers, certificat, documents, valeurs', async () => {
    await completeProfile(ctx, 'hugo');
    const id = await newItem('hugo', 'HUGO-1', true);
    await addDoc('hugo', id, 'insurance');
    const keysBefore = [...ctx.storage.objects.keys()].filter((k) => k.includes(id) || k.includes('/drafts/'));
    expect(keysBefore.length).toBeGreaterThan(0);

    await ctx.http().delete(`/items/${id}`).set(auth('hugo')).send({}).expect(400);
    await ctx.http().delete(`/items/${id}`).set(auth('hugo')).send({ reason: 'sold' }).expect(204);

    await ctx.http().get(`/items/${id}`).set(auth('hugo')).expect(404);
    for (const t of ['certificates', 'documents', 'file_hashes', 'market_values']) {
      const rows = await ctx.ds.query(`select 1 from ${t} where item_id = $1`, [id]);
      expect(rows).toHaveLength(0);
    }
    const hugoKeys = [...ctx.storage.objects.keys()].filter((k) => k.includes(id));
    expect(hugoKeys).toHaveLength(0);
    const logs = await ctx.ds.query('select reason from deletion_logs where item_id = $1', [id]);
    expect(logs).toEqual([{ reason: 'sold' }]);
  });

  it('après suppression, le même identifiant et le même certificat redeviennent utilisables', async () => {
    await completeProfile(ctx, 'ines');
    const file = await readableCertificate('REUSE');
    const id = randomUUID();
    await attachCertificate(ctx, 'ines', id, file);
    await ctx.http().post('/items').set(auth('ines')).send(watchPayload(id, 'INES-1')).expect(201);
    await ctx.http().delete(`/items/${id}`).set(auth('ines')).send({ reason: 'given' }).expect(204);
    const id2 = randomUUID();
    expect((await attachCertificate(ctx, 'ines', id2, file)).status).toBe(200);
    await ctx.http().post('/items').set(auth('ines')).send(watchPayload(id2, 'INES-1')).expect(201);
  });
});

describe('suppression du compte : irréversible, aucune donnée conservée', () => {
  it('purge base, stockage et compte Firebase', async () => {
    await completeProfile(ctx, 'jules');
    const a = await newItem('jules', 'JULES-1', true);
    await addDoc('jules', a, 'insurance');
    await ctx.http().delete(`/items/${await newItem('jules', 'JULES-2')}`).set(auth('jules')).send({ reason: 'lost' }).expect(204);
    // brouillon abandonné
    await attachCertificate(ctx, 'jules', randomUUID());
    const [{ id: userId }] = await ctx.ds.query("select id from users where auth_uid = 'jules'");

    await ctx.http().delete('/account').set(auth('jules')).expect(204);

    expect(await ctx.ds.query('select 1 from users where id = $1', [userId])).toHaveLength(0);
    for (const t of ['items', 'item_drafts', 'deletion_logs']) {
      expect(await ctx.ds.query(`select 1 from ${t} where user_id = $1`, [userId])).toHaveLength(0);
    }
    expect([...ctx.storage.objects.keys()].filter((k) => k.includes(userId))).toHaveLength(0);
    expect(ctx.verifier.deleted).toContain('jules');
  });
});
