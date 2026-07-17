import { useState, useEffect, useCallback } from "react";
import { getSupabaseClient, ownerFetch } from "./supabaseClient";

export interface SeedPacket {
  id: string;
  origin_node: string;
  node_name?: string;
  trace_id: string;
  hop: number;
  parent_event_id?: string;
  created_at: string;
  payload: {
    text: string;
    description?: string;
    lyrics?: string;
    [key: string]: any;
  };
}

export type ConnectionState = "offline" | "connecting" | "live" | "error" | "locked";

export function useHiveRealtime(hiveEnabled: boolean, isAuthorized: boolean) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("offline");
  const [packets, setPackets] = useState<SeedPacket[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthorized) {
      setConnectionState("locked");
      setPackets([]);
      return;
    }

    if (!hiveEnabled) {
      setConnectionState("offline");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setConnectionState("offline");
      return;
    }

    setConnectionState("connecting");

    const channel = supabase.channel("witness:the-autodisco", {
      config: {
        broadcast: { ack: true }
      }
    });

    channel
      .on("broadcast", { event: "seed_packet" }, (response) => {
        const payload = response.payload as Partial<SeedPacket>;
        
        // Validation
        if (!payload.id || !payload.origin_node || !payload.trace_id || !payload.payload?.text) {
          console.warn("⚠️ Received invalid SeedPacket via Realtime:", payload);
          return;
        }

        // Hard cap recursive packet hop at 3
        if (typeof payload.hop === "number" && payload.hop > 3) {
          console.warn("⚠️ Ignored packet: Max hop limit (3) exceeded.", payload);
          return;
        }

        const validPacket: SeedPacket = {
          id: payload.id,
          origin_node: payload.origin_node,
          node_name: payload.node_name || payload.origin_node,
          trace_id: payload.trace_id,
          hop: typeof payload.hop === "number" ? payload.hop : 1,
          parent_event_id: payload.parent_event_id,
          created_at: payload.created_at || new Date().toISOString(),
          payload: {
            text: payload.payload.text,
            description: payload.payload.description,
            lyrics: payload.payload.lyrics,
            ...payload.payload
          }
        };

        setPackets((prev) => {
          // Deduplicate by packet ID
          if (prev.some((p) => p.id === validPacket.id)) {
            return prev;
          }
          // Keep at most 20 transient packets
          const updated = [validPacket, ...prev];
          return updated.slice(0, 20);
        });
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionState("live");
          setErrorMsg(null);
        } else if (status === "CLOSED") {
          setConnectionState("offline");
        } else if (status === "CHANNEL_ERROR") {
          setConnectionState("error");
          setErrorMsg("Realtime channel failed to connect.");
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [hiveEnabled, isAuthorized]);

  const dismissPacket = useCallback((id: string) => {
    setPackets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const plantPacket = useCallback(async (packet: SeedPacket, note?: string) => {
    try {
      const response = await ownerFetch("/api/hive/plant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          packet,
          note
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to plant seed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Remove from active transient packets list after planting
      dismissPacket(packet.id);
      return result;
    } catch (err: any) {
      console.error("Error planting seed packet:", err);
      throw err;
    }
  }, [dismissPacket]);

  return {
    connectionState,
    packets,
    errorMsg,
    dismissPacket,
    plantPacket
  };
}
