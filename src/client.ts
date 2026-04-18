import { ensureLoggedIn, getApiUrl } from "./config";

interface ApiError {
  error: string;
  detail?: string;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const apiKey = await ensureLoggedIn();
  const url = `${getApiUrl()}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`API error (${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    const err = data as ApiError;
    throw new Error(err.detail || err.error || `Request failed (${res.status})`);
  }

  return data as T;
}

export interface Project {
  id: string;
  name: string;
  tables: string[];
  status: string;
  catalog_url: string;
  namespace: string;
  project_key?: string;
  created_at: string;
  error?: string;
  query_url?: string;
  session?: { active: boolean; status?: string; started_at?: string; last_query_at?: string };
}

export interface CatalogInfo {
  catalog_url: string;
  token?: string;
  warehouse: string;
  namespace: string;
  clickhouse?: {
    url: string;
    user: string;
    password: string;
    database: string;
  } | null;
  snippets?: {
    clickhouse: string;
    duckdb: string;
    spark: string;
    pyiceberg?: string;
  };
}

export interface QueryResult {
  meta?: { name: string; type: string }[];
  data?: unknown[][];
  rows?: number;
  statistics?: { elapsed: number; rows_read: number; bytes_read: number };
  status?: string;
  session_id?: string;
  retry_after?: number;
}

export interface TableInfo {
  source_table: string;
  namespace: string;
  iceberg_table: string;
  columns: { name: string; pg_type: string; iceberg_type: string; nullable: boolean }[];
  primary_key: string[];
  partition_spec: string[];
  stats: { rows_processed: number; buffered_rows: number; buffered_bytes: number };
}

export const api = {
  createProject: (data: {
    pg_url: string;
    tables: (string | { name: string; iceberg?: { partition?: string[] } })[];
    sink?: Record<string, unknown>;
  }) => request<Project>("POST", "/api/v1/projects", data),

  getQuota: () => request<{ used: number; limit: number | null }>("GET", "/api/v1/projects/quota"),

  listProjects: () => request<Project[]>("GET", "/api/v1/projects"),

  getProject: (id: string) =>
    request<Project>("GET", `/api/v1/projects/${id}`),

  getCatalog: (id: string) =>
    request<CatalogInfo>("GET", `/api/v1/projects/${id}/catalog`),

  updateProject: (id: string, data: {
    tables?: (string | { name: string; iceberg?: { partition?: string[] } })[];
    sink?: Record<string, unknown>;
  }) => request<{ ok: boolean; tables: string[]; message: string }>("PATCH", `/api/v1/projects/${id}`, data),

  pauseProject: (id: string) =>
    request<{ ok: boolean; message: string }>("POST", `/api/v1/projects/${id}/pause`),

  resumeProject: (id: string) =>
    request<{ ok: boolean; message: string }>("POST", `/api/v1/projects/${id}/resume`),

  destroyProject: (id: string) =>
    request<{ ok: boolean; message: string }>(
      "DELETE",
      `/api/v1/projects/${id}`
    ),



  query: (id: string, sql: string, format?: string) =>
    request<QueryResult>("POST", `/api/v1/projects/${id}/query`, { sql, format }),
};
