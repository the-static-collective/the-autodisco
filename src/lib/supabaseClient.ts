import { createClient, SupabaseClient } from "@supabase/supabase-js";

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;

  const isServer = typeof window === "undefined";
  const url = isServer
    ? process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    : ((import.meta as any).env?.VITE_SUPABASE_URL as string);

  const key = isServer
    ? process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    : ((import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string);

  if (!url || !key) {
    console.warn("⚠️ Supabase URL or Publishable Key is missing. Operating locally.");
    return null;
  }

  try {
    clientInstance = createClient(url, key);
    return clientInstance;
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
    return null;
  }
}

export function getSpaceId(): string {
  const isServer = typeof window === "undefined";
  const spaceId = isServer
    ? process.env.AUTODISCO_SPACE_ID || process.env.VITE_AUTODISCO_SPACE_ID
    : ((import.meta as any).env?.VITE_AUTODISCO_SPACE_ID as string);

  return spaceId || "default-space-autodisco";
}

export async function ownerFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Authentication required");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);

  return fetch(input, { ...init, headers });
}
