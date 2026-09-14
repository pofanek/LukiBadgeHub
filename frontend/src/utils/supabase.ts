import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
console.log("Supabase env:", {
  urlExists: Boolean(SUPABASE_URL),
  anonExists: Boolean(SUPABASE_ANON),
  mode: import.meta.env.MODE
});
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
