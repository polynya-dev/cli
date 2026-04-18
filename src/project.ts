// polynya.yaml reader/writer.
// The project config file lives in the current working directory.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { parse, stringify } from "yaml";

const CONFIG_FILE = "polynya.yaml";

export interface TableConfig {
  name: string;
  iceberg?: {
    partition?: string[];
  };
}

export interface SinkConfig {
  flush_interval?: string;
  flush_rows?: number;
  flush_bytes?: number;
  target_file_size?: number;
  materializer_interval?: string;
  compaction_target_size?: number;
}

export interface ProjectConfig {
  project: {
    id: string;
    name: string;
  };
  tables: (string | TableConfig)[];
  sink?: SinkConfig;
}

export function configPath(): string {
  return resolve(process.cwd(), CONFIG_FILE);
}

export function configExists(): boolean {
  return existsSync(configPath());
}

export function loadProjectConfig(): ProjectConfig {
  const path = configPath();
  if (!existsSync(path)) {
    throw new Error(`No ${CONFIG_FILE} found. Run 'polynya init' first.`);
  }
  const raw = readFileSync(path, "utf-8");
  return parse(raw) as ProjectConfig;
}

export function saveProjectConfig(config: ProjectConfig): void {
  const yaml = stringify(config, { lineWidth: 0 });
  writeFileSync(configPath(), yaml);
}

// Normalize table entries to plain strings for the API.
export function tableNames(config: ProjectConfig): string[] {
  return config.tables.map((t) => (typeof t === "string" ? t : t.name));
}

// Resolve project name: use argument if given, otherwise read from polynya.yaml.
export function resolveProjectName(nameArg?: string): string {
  if (nameArg) return nameArg;
  const config = loadProjectConfig(); // throws if no yaml
  return config.project.name;
}

// Project key storage — kept in ~/.polynya/keys/ (not in repo).
import { homedir } from "node:os";
import { join } from "node:path";

const KEYS_DIR = join(homedir(), ".polynya", "keys");

export function saveProjectKey(projectId: string, key: string): void {
  mkdirSync(KEYS_DIR, { recursive: true });
  writeFileSync(join(KEYS_DIR, projectId), key, { mode: 0o600 });
}

export function loadProjectKey(projectId?: string): string {
  // Env var takes precedence
  const envKey = process.env.POLYNYA_PROJECT_KEY;
  if (envKey) return envKey;

  const id = projectId ?? loadProjectConfig().project.id;
  const path = join(KEYS_DIR, id);
  if (!existsSync(path)) {
    throw new Error(`No project key found. Set POLYNYA_PROJECT_KEY or re-create the project.`);
  }
  return readFileSync(path, "utf-8").trim();
}
