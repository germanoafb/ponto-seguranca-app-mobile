import * as FileSystem from 'expo-file-system';

import { decode   } from 'base64-arraybuffer';
import { supabase } from './supabase';

const BUCKET = 'selfies-ponto';

export async function uploadSelfie(email: string, localUri: string): Promise<string> {
  const safeEmail = email.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '');
  const filePath = `${safeEmail}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, decode(base64), {
    contentType: 'image/jpeg',
    upsert: false,
  });

  if (error) {
    throw new Error(error.message || 'Erro ao enviar selfie.');
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
