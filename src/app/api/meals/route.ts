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
    .from("meals")
    .select("*, food_items(*)")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (date) {
    query = query.eq("date", date);
  } else if (from && to) {
    query = query.gte("date", from).lte("date", to);
  }

  const { data, error } = await query;

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { food_items, ...mealData } = body;

  // Insert meal
  const { data: meal, error: mealError } = await supabase
    .from("meals")
    .insert(mealData)
    .select()
    .single();

  if (mealError)
    return Response.json({ error: mealError.message }, { status: 500 });

  // Insert food items
  if (food_items?.length) {
    const items = food_items.map((item: Record<string, unknown>) => ({
      ...item,
      meal_id: meal.id,
    }));
    const { error: itemsError } = await supabase
      .from("food_items")
      .insert(items);

    if (itemsError)
      return Response.json({ error: itemsError.message }, { status: 500 });
  }

  // Return meal with food items
  const { data } = await supabase
    .from("meals")
    .select("*, food_items(*)")
    .eq("id", meal.id)
    .single();

  return Response.json(data);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const { error } = await supabase.from("meals").delete().eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
