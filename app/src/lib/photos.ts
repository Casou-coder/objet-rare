import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const SIGNED_URL_TTL = 300; // 5 minutes

export async function getSignedPhotoUrl(pathOrUrl: string): Promise<string | null> {
  let path = pathOrUrl;

  // Handle legacy public URLs stored before the bucket became private
  if (pathOrUrl.startsWith('http')) {
    const match = pathOrUrl.match(/\/object\/(?:public|authenticated)\/photos\/(.+?)(?:\?|$)/);
    const extracted = match?.[1];
    if (!extracted) return pathOrUrl; // URL from an unknown origin, pass through
    path = decodeURIComponent(extracted);
  }

  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(path, SIGNED_URL_TTL);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export function useSignedPhotoUrl(pathOrUrl: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pathOrUrl) { setUrl(null); return; }
    let cancelled = false;
    getSignedPhotoUrl(pathOrUrl).then((u) => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [pathOrUrl]);

  return url;
}
