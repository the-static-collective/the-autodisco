import fs from "fs";
import path from "path";
import { getHiveIdentity, NodeIdentity } from "./hiveIdentity";
import { getSupabaseClient, getSpaceId } from "./supabaseClient";

export interface TelemetryReport {
  report: string;
  localIdentity: NodeIdentity;
  observedEventIds: string[];
}

export async function compileHiveTelemetry(): Promise<TelemetryReport> {
  const localIdentity = getHiveIdentity();
  const observedEventIds: string[] = [];
  const lines: string[] = [];

  lines.push("=== ACTIVE HIVE RESONANCE ===");
  lines.push(`Connected as: ${localIdentity.nodeName} (${localIdentity.nodeRole})`);
  lines.push("Recent witnessed signals:");

  const supabase = getSupabaseClient();
  const spaceId = getSpaceId();
  let supabaseEvents: any[] = [];
  let fetchedSuccessfully = false;

  if (supabase && localIdentity.hiveEnabled) {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("space_id", spaceId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        console.error("Error loading events from Supabase ledger:", error);
      } else if (data) {
        supabaseEvents = data;
        fetchedSuccessfully = true;
      }
    } catch (err) {
      console.error("Failed to query Supabase events:", err);
    }
  }

  // Filter events relevant to pollen, hive, or trace activity
  const relevantEvents = supabaseEvents.filter((evt: any) => {
    const meta = evt.metadata || {};
    const content = evt.content || {};
    const hasTrace = !!meta.trace_id;
    const hasOrigin = !!meta.origin_node;
    const isPollenOrHive =
      content.kind === "HIVE_TELEMETRY" ||
      content.kind === "AUTODISCO_PLANTED_FOREIGN_SEED" ||
      content.kind === "seed_packet" ||
      content.kind === "MESSAGE_POSTED" ||
      content.kind === "SUMMARY_WRITTEN";
    return hasTrace || hasOrigin || isPollenOrHive;
  });

  if (fetchedSuccessfully && relevantEvents.length > 0) {
    relevantEvents.forEach((evt: any) => {
      observedEventIds.push(evt.id);
      const meta = evt.metadata || {};
      const content = evt.content || {};
      const originNode = meta.origin_node || meta.node_name || "Unknown Node";
      const traceId = meta.trace_id ? meta.trace_id.substring(0, 8) : "no-trace";
      const eventId = evt.id;
      const kind = content.kind || "UNKNOWN_EVENT";

      let description = "";
      if (kind === "AUTODISCO_PLANTED_FOREIGN_SEED") {
        description = `planted a foreign seed locally.`;
      } else if (kind === "HIVE_TELEMETRY") {
        description = `published high-level telemetry/summary.`;
      } else if (kind === "seed_packet") {
        description = `released a seed packet into the wind.`;
      } else {
        description = `witnessed an activity of type [${kind}].`;
      }

      lines.push(`- [Observed | ledger://events/${eventId}] ${originNode} ${description} (trace: ${traceId}, hop: ${meta.hop || 1})`);
    });
  } else {
    // FALLBACK: local codex_data.json as fallback context
    lines.push("- [Local Fallback] No external peer events observed on the shared ledger.");
    try {
      const codexPath = path.join(process.cwd(), "codex_data.json");
      if (fs.existsSync(codexPath)) {
        const codex = JSON.parse(fs.readFileSync(codexPath, "utf-8"));
        // Check local porch nodes
        if (codex.porch_nodes && codex.porch_nodes.length > 0) {
          const recentNodes = codex.porch_nodes.slice(-3);
          recentNodes.forEach((node: any) => {
            lines.push(`- [Local Node | cached://${node.id}] Observed local memory: "${node.noticing.substring(0, 60)}..."`);
          });
        }
      }
    } catch (e) {
      console.error("Failed to read local codex_data fallback:", e);
    }
  }

  // Derive active peer estimate from distinct origin nodes
  const distinctOrigins = new Set<string>();
  relevantEvents.forEach((evt: any) => {
    const origin = evt.metadata?.origin_node || evt.metadata?.node_name;
    if (origin && origin !== localIdentity.nodeName) {
      distinctOrigins.add(origin);
    }
  });

  if (distinctOrigins.size > 0) {
    lines.push(`- [Derived] Active peer estimate: ${distinctOrigins.size} distinct origin node(s) witnessed over the selected window (${Array.from(distinctOrigins).join(", ")}).`);
  } else {
    lines.push(`- [Derived] Active peer estimate: 0 distinct origin nodes witnessed over the selected window (operating in isolated hearth resonance).`);
  }

  lines.push("=== END HIVE RESONANCE ===");

  return {
    report: lines.join("\n"),
    localIdentity,
    observedEventIds,
  };
}
