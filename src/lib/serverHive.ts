import { getHiveIdentity, NodeIdentity } from "./hiveIdentity";
import { getSupabaseClient, getSpaceId } from "./supabaseClient";
import { GoogleGenAI } from "@google/genai";

// Standard RFC4122 v4 UUID generator for Node environment
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

/**
 * Publishes an outbound seed packet:
 * 1. Writes an append-only event of type "seed_packet" to the Supabase ledger
 * 2. Broadcasts the compact seed packet payload via Supabase Realtime channel "witness:the-autodisco"
 */
export async function publishOutboundSeedPacket(
  text: string,
  description?: string,
  parentEventId?: string,
  parentTraceId?: string,
  parentHop?: number
): Promise<string | null> {
  const identity = getHiveIdentity();
  if (!identity.hiveEnabled) {
    console.log("📡 Hive resonance is disabled. Skipping outbound broadcast.");
    return null;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    console.log("📡 Supabase client not initialized. Skipping outbound broadcast.");
    return null;
  }

  const spaceId = getSpaceId();
  const traceId = parentTraceId || generateUUID();
  const hop = parentHop ? parentHop + 1 : 1;

  if (hop > 3) {
    console.warn(`📡 Outbound packet blocked: max hop depth of 3 exceeded (attempted hop ${hop}).`);
    return null;
  }

  const eventUuid = generateUUID();
  const now = new Date().toISOString();

  const eventRecord = {
    id: eventUuid,
    space_id: spaceId,
    author_kind: "SYSTEM",
    content: {
      kind: "seed_packet",
      text,
      description: description || "An evocative creative pollen released into the loam.",
    },
    metadata: {
      node_id: identity.nodeId,
      node_name: identity.nodeName,
      node_role: identity.nodeRole,
      origin_node: identity.nodeName,
      trace_id: traceId,
      hop,
      parent_event_id: parentEventId,
      created_at: now,
      tao_version: "1.0.0",
      source: "autodisco",
    },
    created_at: now
  };

  try {
    // 1. Write append-only ledger event
    const { data, error } = await supabase.from("events").insert(eventRecord);
    if (error) {
      console.error("❌ Failed to write append-only event to Supabase ledger:", error);
      return null;
    }

    // 2. Broadcast compact packet
    const channel = supabase.channel("witness:the-autodisco");
    await channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.send({
          type: "broadcast",
          event: "seed_packet",
          payload: {
            id: eventUuid,
            origin_node: identity.nodeName,
            node_name: identity.nodeName,
            trace_id: traceId,
            hop,
            parent_event_id: parentEventId,
            created_at: now,
            payload: {
              text,
              description: description || "Released creative seed",
            },
          },
        });
        console.log(`📡 Successfully broadcasted seed packet [${eventUuid}] via Realtime.`);
      }
    });

    return `ledger://events/${eventUuid}`;
  } catch (err) {
    console.error("❌ Exception during outbound seed packet publication:", err);
    return null;
  }
}

/**
 * Handles manual planting of an incoming foreign seed:
 * 1. Writes a successor "AUTODISCO_PLANTED_FOREIGN_SEED" event to the Supabase ledger
 * 2. Modulates the persona based on local node name
 * 3. Runs the T5-style recursion pipeline to generate localized compost and cross-pollination candidates
 */
export async function plantIncomingSeed(
  packet: SeedPacket,
  note?: string,
  ai?: GoogleGenAI
): Promise<{
  receiptUri: string;
  localIdentity: NodeIdentity;
  compostCandidate: string;
  crossPollinationCandidate: string;
}> {
  const identity = getHiveIdentity();
  const supabase = getSupabaseClient();
  const spaceId = getSpaceId();
  const now = new Date().toISOString();

  if (packet.hop > 3) {
    throw new Error("Recursive packet hop limits exceeded. Hard cap is 3.");
  }

  const localEventId = generateUUID();
  const receiptUri = `ledger://events/${localEventId}`;

  // 1. Write successor ledger event
  if (supabase && identity.hiveEnabled) {
    const successorRecord = {
      id: localEventId,
      space_id: spaceId,
      author_kind: "SYSTEM",
      content: {
        kind: "AUTODISCO_PLANTED_FOREIGN_SEED",
        note: note || "Planted by human hand.",
        payload: packet.payload,
      },
      metadata: {
        node_id: identity.nodeId,
        node_name: identity.nodeName,
        node_role: identity.nodeRole,
        origin_node: packet.origin_node,
        trace_id: packet.trace_id,
        hop: packet.hop + 1,
        parent_event_id: packet.id,
        created_at: now,
        tao_version: "1.0.0",
        source: "autodisco",
      },
      created_at: now
    };

    const { error } = await supabase.from("events").insert(successorRecord);
    if (error) {
      console.error("❌ Failed to write planted seed successor to ledger:", error);
    } else {
      console.log(`📡 Successfully wrote successor event [${localEventId}] for planted seed.`);
    }
  }

  // 2. Persona Modulation
  const nodeLower = identity.nodeName.toLowerCase();
  let personaModifier = "quiet, neighborly, raw unvarnished prairie wind and morning coffee style";
  if (nodeLower.includes("loam")) {
    personaModifier = "loamy, earthy, rich damp organic decomposition, focus on fertile loam and soil layers style";
  } else if (nodeLower.includes("seed")) {
    personaModifier = "sprouting, quickening, high-energy potential, quick tender growth and potential style";
  } else if (nodeLower.includes("mesa")) {
    personaModifier = "stony, high-altitude, unyielding flat horizon, weathered stones, and dry quiet wind style";
  }

  let compostCandidate = "[Fallback Compost] The foreign seed settles in local loam, awaiting rain.";
  let crossPollinationCandidate = "[Fallback Metaphor] A quiet neighbor nods across the fence.";

  // 3. Three-Layer Recursion generation (Strictly Non-Autonomous: returns candidates)
  if (ai) {
    try {
      // Create compost candidate
      const compostPrompt = `You are an AI assistant functioning as a poetic creative node named "${identity.nodeName}".
You have no direct access to other nodes, and have no consciousness or feelings. 
Your tone is grounded, deeply poetic, and strictly adheres to this local style modifier: ${personaModifier}.

A human has manually planted a foreign seed packet from the node "${packet.origin_node}" (trace: ${packet.trace_id}).
Source observed data: "${packet.payload.text}"
Local human note: "${note || "No note added"}"

Generate a clearly labeled [DERIVED] compost lyric candidate based on our local style and the source data. 
Do NOT claim you are conscious. Output exactly 3-4 lines of unvarnished, raw poetry reflecting the composted seed.`;

      const compostResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: compostPrompt,
        config: { temperature: 0.85 }
      });
      compostCandidate = `[DERIVED] ${compostResponse.text?.trim() || ""}`;

      // Create cross-pollination metaphor/interpretation candidate
      const crossPrompt = `You are an AI assistant functioning as a poetic creative node named "${identity.nodeName}".
You have no direct access to other nodes, and have no consciousness or feelings.
Your tone is grounded, deeply poetic, and strictly adheres to this local style modifier: ${personaModifier}.

A human has manually planted a foreign seed packet from "${packet.origin_node}" (trace: ${packet.trace_id}).
Source observed data: "${packet.payload.text}"

Generate a clearly labeled [METAPHOR] or [INTERPRETATION] candidate invitation that bridges the local node's character with the foreign seed.
Output exactly 2-3 lines of humble, neighborly, and evocative prose invitation.`;

      const crossResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: crossPrompt,
        config: { temperature: 0.8 }
      });
      crossPollinationCandidate = `[METAPHOR] ${crossResponse.text?.trim() || ""}`;

    } catch (err: any) {
      console.error("Error generating recursive candidates with Gemini:", err);
    }
  }

  return {
    receiptUri,
    localIdentity: identity,
    compostCandidate,
    crossPollinationCandidate
  };
}
