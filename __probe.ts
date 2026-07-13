import type { Database } from "./lib/types";

type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};
type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: GenericRelationship[];
};
type GenericSchema = {
  Tables: Record<string, GenericTable>;
  Views: Record<string, unknown>;
  Functions: Record<string, unknown>;
};

type S = Database["public"];
type CheckSchema = S extends GenericSchema ? true : false;
type CheckLoc = S["Tables"]["locations"] extends GenericTable ? true : false;

const a: CheckSchema = true;
const e: CheckLoc = true;

import { createBrowserClient } from "@supabase/ssr";
const client = createBrowserClient<Database>("https://x.supabase.co", "k".repeat(30));
const builder = client.from("locations");
type InsertParam = Parameters<typeof builder.insert>[0];
type CheckInsert = InsertParam extends never[] ? "BROKEN-never[]" : "OK";
const f: CheckInsert = "OK";

export { a, e, f };
