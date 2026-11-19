import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap, type Schemas } from './client';
import { putFile, type PickedFile } from './upload';
import { useSession } from '@/stores/session';

export const qk = {
  me: ['me'] as const,
  items: (view: 'collection' | 'vault', sort: 'recent' | 'oldest' = 'recent') => ['items', view, sort] as const,
  item: (id: string) => ['item', id] as const,
  certificate: (id: string) => ['certificate', id] as const,
  itemDocuments: (id: string) => ['item-documents', id] as const,
  allDocuments: ['documents'] as const,
  value: (id: string) => ['value', id] as const,
  timeseries: (id: string) => ['timeseries', id] as const,
  issuers: ['issuers'] as const,
  otherTypes: ['other-types'] as const,
};

const useSignedIn = () => useSession((s) => s.status === 'signedIn');

export function useMe() {
  const enabled = useSignedIn();
  return useQuery({ queryKey: qk.me, enabled, queryFn: () => unwrap(api.GET('/me')) });
}

export function usePutMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (full_name: string) => unwrap(api.PUT('/me', { body: { full_name } })),
    onSuccess: (me) => qc.setQueryData(qk.me, me),
  });
}

export function useItems(view: 'collection' | 'vault', sort: 'recent' | 'oldest' = 'recent') {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: qk.items(view, sort),
    enabled,
    queryFn: () => unwrap(api.GET('/items', { params: { query: { view, sort } } })).then((r) => r.items ?? []),
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: qk.item(id),
    queryFn: () => unwrap(api.GET('/items/{id}', { params: { path: { id } } })),
  });
}

export function useCertificate(id: string, enabled = true) {
  return useQuery({
    queryKey: qk.certificate(id),
    enabled,
    staleTime: 60_000, // URL présignée valable 5 min ; régénérée silencieusement ensuite
    queryFn: () => unwrap(api.GET('/items/{id}/certificate', { params: { path: { id } } })),
  });
}

export function useItemDocuments(id: string) {
  return useQuery({
    queryKey: qk.itemDocuments(id),
    staleTime: 60_000,
    queryFn: () => unwrap(api.GET('/items/{id}/documents', { params: { path: { id } } })).then((r) => r.items),
  });
}

export function useAllDocuments() {
  const enabled = useSignedIn();
  return useQuery({ queryKey: qk.allDocuments, enabled, queryFn: () => unwrap(api.GET('/documents')) });
}

export function useValue(id: string) {
  return useQuery({
    queryKey: qk.value(id),
    queryFn: () => unwrap(api.GET('/items/{id}/value', { params: { path: { id } } })),
    refetchInterval: (q) => (q.state.data?.status === 'updating' ? 3000 : false),
  });
}

export function useTimeseries(id: string) {
  return useQuery({
    queryKey: qk.timeseries(id),
    queryFn: () => unwrap(api.GET('/items/{id}/value/timeseries', { params: { path: { id } } })),
  });
}

export function useIssuers() {
  return useQuery({ queryKey: qk.issuers, staleTime: Infinity, queryFn: () => unwrap(api.GET('/metadata/certificate-issuers')).then((r) => r.items ?? []) });
}

export function useOtherTypes() {
  return useQuery({ queryKey: qk.otherTypes, staleTime: Infinity, queryFn: () => unwrap(api.GET('/metadata/controlled-other-types')).then((r) => r.items ?? []) });
}

function invalidateItems(qc: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ['items'] }),
    qc.invalidateQueries({ queryKey: qk.me }),
    qc.invalidateQueries({ queryKey: qk.allDocuments }),
  ]);
}

// ───── Flow d'ajout (décision T2 : brouillon puis objet) ─────

export async function uploadCertificate(draftId: string, file: PickedFile, category: Schemas['Category'] | null) {
  const ticket = await unwrap(
    api.POST('/items/{id}/certificate/upload-url', {
      params: { path: { id: draftId } },
      body: { content_type: file.mimeType, size_bytes: file.size },
    }),
  );
  await putFile(ticket, file);
  return unwrap(
    api.POST('/items/{id}/certificate/confirm', {
      params: { path: { id: draftId } },
      body: category ? { category } : {},
    }),
  );
}

export async function uploadCoverPhoto(draftId: string, file: PickedFile): Promise<string> {
  const ticket = await unwrap(
    api.POST('/items/{id}/photo/upload-url', {
      params: { path: { id: draftId } },
      body: { content_type: file.mimeType, size_bytes: file.size },
    }),
  );
  await putFile(ticket, file);
  return ticket.upload_key;
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Schemas['CreateItem']) => unwrap(api.POST('/items', { body })),
    onSuccess: async (item) => {
      qc.setQueryData(qk.item(item.id), item);
      await invalidateItems(qc);
    },
  });
}

export function useAddDocument(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, type }: { file: PickedFile; type: Schemas['DocumentType'] }) => {
      const ticket = await unwrap(
        api.POST('/items/{id}/documents/upload-url', {
          params: { path: { id: itemId } },
          body: { content_type: file.mimeType, size_bytes: file.size, type },
        }),
      );
      await putFile(ticket, file);
      return unwrap(
        api.POST('/items/{id}/documents/confirm', {
          params: { path: { id: itemId } },
          body: { upload_key: ticket.upload_key, type },
        }),
      );
    },
    onSuccess: async (list) => {
      qc.setQueryData(qk.itemDocuments(itemId), list.items);
      await Promise.all([qc.invalidateQueries({ queryKey: qk.item(itemId) }), qc.invalidateQueries({ queryKey: qk.allDocuments })]);
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Schemas['DeleteItem']) =>
      unwrap(api.DELETE('/items/{id}', { params: { path: { id } }, body })),
    onSuccess: async (_d, { id }) => {
      qc.removeQueries({ queryKey: qk.item(id) });
      qc.removeQueries({ queryKey: qk.certificate(id) });
      qc.removeQueries({ queryKey: qk.itemDocuments(id) });
      await invalidateItems(qc);
    },
  });
}

export function useRefreshValue(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(api.POST('/items/{id}/value/refresh', { params: { path: { id } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.value(id) }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(api.DELETE('/account')),
    onSuccess: async () => {
      qc.clear();
      await useSession.getState().signOut();
    },
  });
}
