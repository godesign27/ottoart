// Supabase Storage stand-in for Replit's GCS-backed object storage.
// Used when STORAGE_BACKEND=supabase. Implements the slice of the
// @google-cloud/storage Bucket/File API that objectStorage.ts and objectAcl.ts
// call, by talking to the Supabase Storage REST API with the server's secret
// key. Buckets stay private: the app server checks each image's ACL and then
// streams it, exactly as it did on Replit.
//
// Per-object ACL metadata ("custom:aclPolicy") is kept in a small JSON file at
// _meta/<object path>.json in the same bucket.
import { PassThrough, Readable } from "stream";

const ACL_PREFIX = "_meta/";

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("STORAGE_BACKEND=supabase needs SUPABASE_URL and SUPABASE_SECRET_KEY");
  }
  return { base: `${url.replace(/\/$/, "")}/storage/v1`, key };
}

function authHeaders(): Record<string, string> {
  const { key } = config();
  // Legacy service_role keys are JWTs and also go in Authorization;
  // new sb_secret_ keys only go in the apikey header.
  return key.startsWith("eyJ") ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
}

const encodePath = (p: string) => p.split("/").map(encodeURIComponent).join("/");

async function storageFetch(method: string, route: string, init: RequestInit = {}) {
  const { base } = config();
  return fetch(`${base}${route}`, {
    ...init,
    method,
    headers: { ...authHeaders(), ...(init.headers as Record<string, string> | undefined) },
  });
}

export async function uploadObject(bucket: string, objectName: string, body: Buffer | string, contentType: string) {
  const res = await storageFetch("POST", `/object/${bucket}/${encodePath(objectName)}`, {
    body,
    headers: { "Content-Type": contentType, "x-upsert": "true" },
  });
  if (!res.ok) throw new Error(`Supabase upload ${objectName} failed: ${res.status} ${await res.text()}`);
}

class SupabaseFile {
  constructor(public bucketName: string, public name: string) {}

  private get route() {
    return `/object/authenticated/${this.bucketName}/${encodePath(this.name)}`;
  }

  async exists(): Promise<[boolean]> {
    const res = await storageFetch("HEAD", this.route);
    if (res.ok) return [true];
    if (res.status === 400 || res.status === 404) return [false];
    throw new Error(`Supabase HEAD ${this.name} failed: ${res.status}`);
  }

  async getMetadata(): Promise<[any]> {
    const head = await storageFetch("HEAD", this.route);
    if (!head.ok) throw new Error(`Object not found: ${this.name}`);
    const metadata: Record<string, string> = {};
    const acl = await storageFetch("GET", `/object/authenticated/${this.bucketName}/${encodePath(ACL_PREFIX + this.name + ".json")}`);
    if (acl.ok) Object.assign(metadata, await acl.json());
    return [{
      contentType: head.headers.get("content-type") || "application/octet-stream",
      size: head.headers.get("content-length") || undefined,
      metadata,
    }];
  }

  async setMetadata(update: { metadata?: Record<string, string> }): Promise<void> {
    const [current] = await this.getMetadata();
    const merged = { ...(current.metadata || {}), ...(update.metadata || {}) };
    await uploadObject(this.bucketName, `${ACL_PREFIX}${this.name}.json`, JSON.stringify(merged), "application/json");
  }

  // Synchronous like GCS's createReadStream: data flows in once the fetch resolves.
  createReadStream() {
    const out = new PassThrough();
    storageFetch("GET", this.route)
      .then((res) => {
        if (!res.ok || !res.body) throw new Error(`Supabase download ${this.name} failed: ${res.status}`);
        Readable.fromWeb(res.body as any).on("error", (e) => out.destroy(e)).pipe(out);
      })
      .catch((err) => out.destroy(err));
    return out;
  }
}

export const supabaseObjectStorageClient = {
  bucket(bucketName: string) {
    return {
      file(objectName: string) {
        return new SupabaseFile(bucketName, objectName);
      },
    };
  },
};

// Signed URL the browser PUTs the raw file to (valid ~2 hours).
export async function supabaseSignedUploadURL(bucketName: string, objectName: string): Promise<string> {
  const res = await storageFetch("POST", `/object/upload/sign/${bucketName}/${encodePath(objectName)}`);
  if (!res.ok) throw new Error(`Supabase sign upload failed: ${res.status} ${await res.text()}`);
  const { url } = await res.json();
  return `${config().base}${url}`;
}

// Turns a signed upload URL back into "/<bucket>/<object>" (or null if it isn't one).
export function supabaseUploadUrlToPath(rawUrl: string): string | null {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const prefix = url ? `${url}/storage/v1/object/upload/sign/` : null;
  if (!prefix || !rawUrl.startsWith(prefix)) return null;
  return "/" + decodeURIComponent(rawUrl.slice(prefix.length).split("?")[0]);
}
