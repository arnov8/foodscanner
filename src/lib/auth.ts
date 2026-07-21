import { supabase } from "./supabase";

// Garde-fou des routes IA (/api/analyze, /api/suggest) : l'appelant doit
// présenter un profile_id existant en base. Ce n'est pas une vraie auth
// (pas de secret), mais ça bloque les bots/scanners qui brûleraient des
// tokens Anthropic sur une URL publique.
export async function isValidProfile(profileId: unknown): Promise<boolean> {
  if (typeof profileId !== "string" || !profileId) return false;
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .single();
  return Boolean(data);
}
