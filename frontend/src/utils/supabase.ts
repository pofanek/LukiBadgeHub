import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Each callback route consumes its own one-time URL credentials. Letting the
// client do that during module initialization races the route component and
// makes a valid recovery code appear expired on its second exchange attempt.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    detectSessionInUrl: false,
  },
});
