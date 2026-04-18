import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

interface Config {
  apiKey?: string;
  apiUrl: string;
}

const CONFIG_DIR = join(homedir(), ".polynya");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");
const DEFAULT_API_URL = "https://api.polynya.dev";

export function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) {
    return { apiUrl: DEFAULT_API_URL };
  }
  const raw = readFileSync(CONFIG_FILE, "utf-8");
  return { apiUrl: DEFAULT_API_URL, ...JSON.parse(raw) };
}

export function saveConfig(config: Partial<Config>): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  const existing = loadConfig();
  const merged = { ...existing, ...config };
  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2) + "\n");
}

export async function ensureLoggedIn(): Promise<string> {
  const config = loadConfig();
  if (config.apiKey) return config.apiKey;

  // Auto-trigger login
  const { loginCommand } = await import("./commands/login");
  await loginCommand();

  // Re-read config after login
  const updated = loadConfig();
  if (!updated.apiKey) {
    console.error("Login failed.");
    process.exit(1);
  }
  return updated.apiKey;
}

export function getApiKey(): string {
  const config = loadConfig();
  if (!config.apiKey) {
    console.error("Not logged in. Run: npx polynya login");
    process.exit(1);
  }
  return config.apiKey;
}

export function getApiUrl(): string {
  return loadConfig().apiUrl;
}
