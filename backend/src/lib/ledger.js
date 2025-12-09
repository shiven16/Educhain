import fs from "fs";
import path from "path";
import { DATA_DIR } from "../config.js";

const LEDGER_FILE = path.join(DATA_DIR, "ledger.json");

function ensureLedgerFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LEDGER_FILE)) {
    fs.writeFileSync(LEDGER_FILE, JSON.stringify([], null, 2), "utf8");
  }
}

export function getLedger() {
  ensureLedgerFile();
  const raw = fs.readFileSync(LEDGER_FILE, "utf8");
  return JSON.parse(raw);
}

export function appendToLedger(entry) {
  const ledger = getLedger();
  ledger.push(entry);
  fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2), "utf8");
  return entry;
}

export function findCredentialById(id) {
  const ledger = getLedger();
  return ledger.find((c) => c.id === id) || null;
}
