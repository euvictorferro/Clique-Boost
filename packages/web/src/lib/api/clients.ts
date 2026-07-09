import { Client } from "@clique-boost/shared";
import { supabase } from "./supabase";

// ─── Row mapping ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToClient(row: any): Client {
  return {
    id: row.id,
    name: row.name,
    brandName: row.brand_name,
    niche: row.niche,
    instagramHandle: row.instagram_handle ?? undefined,
    competitors: row.competitors ?? [],
    socialNetworks: row.social_networks ?? [],
    toneOfVoice: row.tone_of_voice ?? "",
    contentGoal: row.content_goal ?? "",
    hasVisualIdentity: row.has_visual_identity ?? false,
    brandColors: row.brand_colors ?? undefined,
    obsidianPath: "",  // mantido por compatibilidade — não usado como storage
    trelloBoardId: row.trello_board_id ?? undefined,
    metaAccessToken: row.meta_access_token ?? undefined,
    metaTokenExpiresAt: row.meta_token_expires_at ?? undefined,
    profilePictureUrl: row.profile_picture_url ?? undefined,
    status: row.status ?? "active",
    createdAt: row.created_at,
    supabaseUserId: row.supabase_user_id ?? undefined,
    planId: row.plan_id ?? undefined,
    paymentStatus: row.payment_status ?? undefined,
    paymentProofUrl: row.payment_proof_url ?? undefined,
    paymentConfirmedAt: row.payment_confirmed_at ?? undefined,
  };
}

function clientToRow(client: Client): Record<string, unknown> {
  return {
    id: client.id,
    name: client.name,
    brand_name: client.brandName,
    niche: client.niche,
    instagram_handle: client.instagramHandle ?? null,
    competitors: client.competitors,
    social_networks: client.socialNetworks,
    tone_of_voice: client.toneOfVoice,
    content_goal: client.contentGoal,
    has_visual_identity: client.hasVisualIdentity,
    brand_colors: client.brandColors ?? null,
    trello_board_id: client.trelloBoardId ?? null,
    meta_access_token: client.metaAccessToken ?? null,
    meta_token_expires_at: client.metaTokenExpiresAt ?? null,
    profile_picture_url: client.profilePictureUrl ?? null,
    status: client.status,
    supabase_user_id: client.supabaseUserId ?? null,
    ...(client.planId !== undefined && { plan_id: client.planId }),
    ...(client.paymentStatus !== undefined && { payment_status: client.paymentStatus }),
    ...(client.paymentProofUrl !== undefined && { payment_proof_url: client.paymentProofUrl }),
    updated_at: new Date().toISOString(),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function readClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`readClients: ${error.message}`);
  return (data ?? []).map(rowToClient);
}

export async function getClient(id: string): Promise<Client | undefined> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();
  if (error?.code === "PGRST116") return undefined; // not found
  if (error) throw new Error(`getClient(${id}): ${error.message}`);
  return rowToClient(data);
}

export async function upsertClient(client: Client): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .upsert(clientToRow(client), { onConflict: "id" });
  if (error) throw new Error(`upsertClient(${client.id}): ${error.message}`);
}

export async function updateClientField(
  id: string,
  fields: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`updateClientField(${id}): ${error.message}`);
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
