import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Kiểm tra cấu hình đã có chưa (cho UI hiển thị cảnh báo nếu thiếu)
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
