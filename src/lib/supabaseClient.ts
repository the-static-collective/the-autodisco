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
