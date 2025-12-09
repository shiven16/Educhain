import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");

export const NODE_NAME = process.env.NODE_NAME || "node-1";
export const NODE_TYPE = process.env.NODE_TYPE || "university"; // university | employer | relay | registry

export const DATA_DIR = process.env.DATA_DIR || path.join(ROOT_DIR, "nodes", NODE_NAME);

export const HTTP_PORT = parseInt(process.env.HTTP_PORT || "3000", 10);
export const P2P_PORT = parseInt(process.env.P2P_PORT || "4000", 10);

export const REGISTRY_ENABLED = NODE_TYPE === "registry";

// Registry node URL - only used by other nodes
export const REGISTRY_URL = process.env.REGISTRY_URL || "http://registry:3000";

export const HEARTBEAT_INTERVAL_MS = 3000;
export const HEARTBEAT_TIMEOUT_MS = 10000; // 10 sec → mark offline if missed
