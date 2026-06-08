import fs from "fs";
import path from "path";
import { Client } from "./types";

const DATA_PATH = path.join(process.cwd(), "..", "data", "clients.json");

export function loadClients(): Client[] {
  if (!fs.existsSync(DATA_PATH)) return [];
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")) as Client[];
}

export function saveClients(clients: Client[]): void {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(clients, null, 2), "utf-8");
}

export function getClient(id: string): Client | undefined {
  return loadClients().find((c) => c.id === id);
}

export function upsertClient(client: Client): void {
  const clients = loadClients();
  const idx = clients.findIndex((c) => c.id === client.id);
  if (idx >= 0) {
    clients[idx] = client;
  } else {
    clients.push(client);
  }
  saveClients(clients);
}

export function readClients(): Client[] {
  return loadClients();
}

export function writeClients(clients: Client[]): void {
  saveClients(clients);
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
