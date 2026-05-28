import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchItems, fetchItem, createItem, updateItem, deleteItem, uploadCoverPhoto } from './api';
import { useAuth } from '@/stores/auth';
import type { ItemFormValues } from './schemas';

export const itemKeys = {
  all: ['items'] as const,
  list: () => [...itemKeys.all, 'list'] as const,
  detail: (id: string) => [...itemKeys.all, 'detail', id] as const,
};

export function useItems() {
  const session = useAuth((s) => s.session);
  return useQuery({ queryKey: itemKeys.list(), queryFn: fetchItems, enabled: !!session, placeholderData: keepPreviousData });
}

export function useItem(id: string | undefined) {
  return useQuery({
    queryKey: itemKeys.detail(id ?? ''),
    queryFn: () => fetchItem(id!),
    enabled: Boolean(id),
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ItemFormValues) => createItem(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.list() }),
  });
}

export function useUpdateItem(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<ItemFormValues>) => updateItem(id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.list() });
      qc.invalidateQueries({ queryKey: itemKeys.detail(id) });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.list() }),
  });
}

export function useUploadCoverPhoto(itemId: string, ownerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uri: string) => uploadCoverPhoto(itemId, uri, ownerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.list() });
      qc.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
    },
  });
}
