import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profile_id");
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!profileId) {
    return Response.json({ error: "profile_id required" }, { status: 400 });
  }

  let query = supabase
    .from("weight_entries")
    .select("*")
    .eq("profile_id", profileId)
    .order("date", { ascending: false });

  if (date) {
    query = query.eq("date", date);
  } else if (from && to) {
    query = query.gte("date", from).lte("date", to);
  } else {
    // Default: last 30 entries
    query = query.limit(30);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { profile_id, date, weight } = body;

  if (!profile_id || !date || !weight) {
    return Response.json({ error: "profile_id, date, and weight required" }, { status: 400 });
  }

  // Upsert: insert or update if date already exists
  const { data, error } = await supabase
    .from("weight_entries")
    .upsert(
      { profile_id, date, weight },
      { onConflict: "profile_id,date" }
    )
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Recalculate TDEE goals based on new weight
  const { data: profile } = await supabase
    .from("profiles")
    .select("sex, age, height, activity_level, deficit_target")
    .eq("id", profile_id)
    .single();

  if (profile) {
    const { sex, age, height, activity_level, deficit_target } = profile;
    let bmr: number;
    if (sex === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    const tdee = Math.round(bmr * activity_level);
    const targetCalories = Math.max(1200, tdee - deficit_target);
    const proteinCals = targetCalories * 0.3;
    const carbsCals = targetCalories * 0.4;
    const fatCals = targetCalories * 0.3;

    await supabase
      .from("profiles")
      .update({
        daily_calories_goal: Math.round(targetCalories),
        daily_protein_goal: Math.round(proteinCals / 4),
        daily_carbs_goal: Math.round(carbsCals / 4),
        daily_fat_goal: Math.round(fatCals / 9),
      })
      .eq("id", profile_id);
  }

  return Response.json(data);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const { error } = await supabase.from("weight_entries").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
