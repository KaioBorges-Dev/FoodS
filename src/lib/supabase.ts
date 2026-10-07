// ====================================================================
// FoodS — Supabase Client & Backend API Integration
// ====================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'Erro na requisição da API FoodS');
  }

  return json.data as T;
}

export async function uploadImageToSupabase(file: File, folder: string = 'assets'): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    // Tenta fazer o upload para o bucket 'foods-assets' do Supabase Storage
    const { data, error } = await supabase.storage
      .from('foods-assets')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (error) {
      // Fallback gracioso usando FileReader se o bucket ainda não tiver sido provisionado no Supabase
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabase.storage.from('foods-assets').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (err) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
}
