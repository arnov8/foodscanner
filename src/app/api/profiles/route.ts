import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const viewerId = searchParams.get("viewer_id");

  // If a viewer is specified, check if they are admin
  if (viewerId) {
    const { data: viewer } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", viewerId)
      .single();

    // Non-admin users can only see their own profile
    if (viewer && !viewer.is_admin) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", viewerId);

      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json(data);
    }
  }

  // Admin or no viewer specified: return all profiles
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { data, error } = await supabase
    .from("profiles")
    .insert(body)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, viewer_id, ...updates } = body;

  // Non-admin users can only update their own profile
  if (viewer_id && viewer_id !== id) {
    const { data: viewer } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", viewer_id)
      .single();

    if (!viewer?.is_admin) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }
  }

  // Prevent non-admin from setting is_admin
  if (!updates.is_admin) delete updates.is_admin;

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(request: Request) {
  const { id, viewer_id } = await request.json();

  // Non-admin users can only delete their own profile
  if (viewer_id && viewer_id !== id) {
    const { data: viewer } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", viewer_id)
      .single();

    if (!viewer?.is_admin) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }
  }

  const { error } = await supabase.from("profiles").delete().eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
