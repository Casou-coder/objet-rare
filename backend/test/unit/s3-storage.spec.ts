import { DeleteObjectsCommand, ListObjectVersionsCommand } from '@aws-sdk/client-s3';
import { S3Storage } from '../../src/storage/storage';

function storageWith(responder: (cmd: unknown) => unknown) {
  const s = new S3Storage({ bucket: 'b', region: 'eu-central-003', forcePathStyle: false, endpoint: 'https://s3.example' });
  const sent: unknown[] = [];
  (s as unknown as { client: { send: (c: unknown) => Promise<unknown> } }).client = {
    send: async (c: unknown) => {
      sent.push(c);
      return responder(c);
    },
  };
  return { s, sent };
}

describe('S3Storage.deleteMany — purge totale sur bucket versionné', () => {
  it('supprime toutes les versions et marqueurs de la clé exacte, jamais les clés voisines', async () => {
    const { s, sent } = storageWith((c) => {
      if (c instanceof ListObjectVersionsCommand) {
        return {
          Versions: [
            { Key: 'u/1/cert', VersionId: 'v2' },
            { Key: 'u/1/cert', VersionId: 'v1' },
            { Key: 'u/1/cert-bis', VersionId: 'x' },
          ],
          DeleteMarkers: [{ Key: 'u/1/cert', VersionId: 'm1' }],
          IsTruncated: false,
        };
      }
      return {};
    });
    await s.deleteMany(['u/1/cert', 'u/1/cert']);
    const del = sent.find((c) => c instanceof DeleteObjectsCommand) as DeleteObjectsCommand;
    expect(del.input.Delete?.Objects).toEqual([
      { Key: 'u/1/cert', VersionId: 'v2' },
      { Key: 'u/1/cert', VersionId: 'v1' },
      { Key: 'u/1/cert', VersionId: 'm1' },
    ]);
    expect(sent.filter((c) => c instanceof ListObjectVersionsCommand)).toHaveLength(1);
  });

  it('suit la pagination des versions', async () => {
    let page = 0;
    const { s, sent } = storageWith((c) => {
      if (c instanceof ListObjectVersionsCommand) {
        page++;
        return page === 1
          ? { Versions: [{ Key: 'k', VersionId: 'a' }], IsTruncated: true, NextKeyMarker: 'k', NextVersionIdMarker: 'a' }
          : { Versions: [{ Key: 'k', VersionId: 'b' }], IsTruncated: false };
      }
      return {};
    });
    await s.deleteMany(['k']);
    const del = sent.find((c) => c instanceof DeleteObjectsCommand) as DeleteObjectsCommand;
    expect(del.input.Delete?.Objects?.map((o) => o.VersionId)).toEqual(['a', 'b']);
  });

  it('signale une suppression incomplète', async () => {
    const { s } = storageWith((c) =>
      c instanceof ListObjectVersionsCommand ? { IsTruncated: false } : { Errors: [{ Key: 'k', Code: 'AccessDenied' }] },
    );
    await expect(s.deleteMany(['k'])).rejects.toThrow(/incomplète/);
  });
});
