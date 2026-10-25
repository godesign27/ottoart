// Which object storage the server uses for uploaded images.
//   STORAGE_BACKEND=supabase -> Supabase Storage (server/supabaseObjectStorage.ts)
//   STORAGE_BACKEND=local    -> ./.local-storage folder (server/localObjectStorage.ts)
//   unset                    -> local when LOCAL_DEV=1, otherwise Replit/GCS
export type StorageBackend = "supabase" | "local" | "gcs";

export function getStorageBackend(): StorageBackend {
  const explicit = process.env.STORAGE_BACKEND;
  if (explicit === "supabase" || explicit === "local" || explicit === "gcs") return explicit;
  return process.env.LOCAL_DEV === "1" ? "local" : "gcs";
}
