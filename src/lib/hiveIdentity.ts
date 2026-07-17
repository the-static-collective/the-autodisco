import fs from "fs";
import path from "path";

export interface NodeIdentity {
  nodeId: string;
  nodeName: string;
  nodeRole: "PRIMARY_HUB" | "CLONED_NODE";
  hiveEnabled: boolean;
}

const IDENTITY_FILE_PATH = path.join(process.cwd(), "node_identity.json");

const prairieNouns = ["Loam", "Hearth", "Grassland", "Wind", "Ditch", "Silt", "Creek", "Coulee", "Mesa", "Prairiewind", "Seed", "Clod", "Table", "Cup", "Coop", "Thresh"];
const poetryAdjectives = ["Quiet", "Neighborly", "Raw", "Unvarnished", "Grounded", "Prairie", "Soil", "Deep", "Loamy", "Humble", "Patient", "Resilient", "Stony", "Weathered"];

function generateRandomNodeName(): string {
  const adj = poetryAdjectives[Math.floor(Math.random() * poetryAdjectives.length)];
  const noun = prairieNouns[Math.floor(Math.random() * prairieNouns.length)];
  return `${adj} ${noun} Node`;
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getHiveIdentity(): NodeIdentity {
  const hiveEnabled = process.env.ENABLE_HIVE_RESONANCE !== "false";
  
  let cachedName = "";
  let cachedId = "";
  let cachedRole: "PRIMARY_HUB" | "CLONED_NODE" = "CLONED_NODE";
  
  // 1. Try to read from node_identity.json
  try {
    if (fs.existsSync(IDENTITY_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(IDENTITY_FILE_PATH, "utf-8"));
      if (data.node_name) cachedName = data.node_name;
      if (data.node_id) cachedId = data.node_id;
      if (data.role === "PRIMARY_HUB" || data.role === "CLONED_NODE") {
        cachedRole = data.role;
      }
    }
  } catch (e) {
    console.error("Error reading node_identity.json:", e);
  }

  // 2. Resolve final properties with fallbacks
  const resolvedId = cachedId || generateUUID();
  const resolvedName = process.env.RESONANCE_NODE_NAME || cachedName || generateRandomNodeName() || "Autodisco Hearth Node";
  
  // Node role is PRIMARY_HUB only when explicitly configured (either in env or cache); otherwise CLONED_NODE
  let resolvedRole: "PRIMARY_HUB" | "CLONED_NODE" = "CLONED_NODE";
  if (process.env.RESONANCE_NODE_ROLE === "PRIMARY_HUB" || cachedRole === "PRIMARY_HUB") {
    resolvedRole = "PRIMARY_HUB";
  }

  // 3. Save resolved identity back to node_identity.json if any of them were missing or changed
  if (resolvedId !== cachedId || resolvedName !== cachedName || resolvedRole !== cachedRole) {
    try {
      fs.writeFileSync(
        IDENTITY_FILE_PATH,
        JSON.stringify(
          {
            node_id: resolvedId,
            node_name: resolvedName,
            role: resolvedRole,
          },
          null,
          2
        ),
        "utf-8"
      );
    } catch (e) {
      console.error("Error writing node_identity.json:", e);
    }
  }

  return {
    nodeId: resolvedId,
    nodeName: resolvedName,
    nodeRole: resolvedRole,
    hiveEnabled,
  };
}
