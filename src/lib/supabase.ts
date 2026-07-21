import { createClient } from "@supabase/supabase-js";

// Ce client n'est utilisé que côté serveur (routes API). Les variables sans
// préfixe NEXT_PUBLIC_ garantissent que la clé ne sera jamais embarquée dans
// le bundle client (pas de RLS sur la base : cette clé donne un accès complet).
// Repli temporaire sur les anciens noms NEXT_PUBLIC_* pour la transition.
const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
