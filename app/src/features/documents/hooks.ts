import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDocuments, uploadDocument, deleteDocument, renameDocument, updateDocumentExpiry } from './api';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase';
import type { DocumentType, DocumentRow } from '@/types/database';

export const docKeys = {
  all: ['documents'] as const,
  list: (itemId?: string) => [...docKeys.all, 'list', itemId ?? 'all'] as const,
};

export function useDocuments(itemId?: string) {
  const session = useAuth((s) => s.session);
  return useQuery({
    queryKey: docKeys.list(itemId),
    queryFn: () => fetchDocuments(itemId),
    enabled: !!session,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: docKeys.all }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, storagePath }: { id: string; storagePath: string }) =>
      deleteDocument(id, storagePath),
    onSuccess: () => qc.invalidateQueries({ queryKey: docKeys.all }),
  });
}

export function useRenameDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, filename }: { id: string; filename: string }) =>
      renameDocument(id, filename),
    onSuccess: () => qc.invalidateQueries({ queryKey: docKeys.all }),
  });
}

export function useUpdateDocumentExpiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, expiresAt }: { id: string; expiresAt: string | null }) =>
      updateDocumentExpiry(id, expiresAt),
    onSuccess: () => qc.invalidateQueries({ queryKey: docKeys.all }),
  });
}

export const expiringWarrantyKeys = {
  all: ['expiring-warranties'] as const,
};

export function useExpiringWarranties(daysAhead = 60) {
  const session = useAuth((s) => s.session);
  return useQuery({
    queryKey: [...expiringWarrantyKeys.all, daysAhead],
    queryFn: async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + daysAhead);
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('documents')
        .select('id, item_id, filename, expires_at')
        .eq('type', 'warranty')
        .not('expires_at', 'is', null)
        .gte('expires_at', today)
        .lte('expires_at', cutoff.toISOString().split('T')[0])
        .order('expires_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Pick<DocumentRow, 'id' | 'item_id' | 'filename' | 'expires_at'>[];
    },
    enabled: !!session,
  });
}
