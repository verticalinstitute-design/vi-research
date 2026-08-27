import type { Store } from "../types";
import { localStore } from "./local";
import { supabaseStore } from "./supabase";

export function getStore(): Store {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    return supabaseStore;
  }
  return localStore;
}
