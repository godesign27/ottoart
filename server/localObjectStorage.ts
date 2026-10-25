// Local filesystem stand-in for Replit's GCS-backed object storage.
// Used only when LOCAL_DEV=1. Implements just the slice of the
// @google-cloud/storage Bucket/File API that objectStorage.ts and
// objectAcl.ts call, and an Express route that plays the role of the
// signed upload/download URL.
import fs from "fs";
import path from "path";
import type { Express } from "express";
import express from "express";

export const LOCAL_STORAGE_ROOT = path.resolve(process.cwd(), ".local-storage");
export const LOCAL_STORAGE_URL_PREFIX = "/__local-storage";

function safeJoin(...parts: string[]): string {
  const full = path.resolve(LOCAL_STORAGE_ROOT, ...parts);
  if (!full.startsWith(LOCAL_STORAGE_ROOT + path.sep)) {
    throw new Error("Invalid object path");
  }
  return full;
}

type Meta = { contentType?: string; metadata?: Record<string, string> };

class LocalFile {
  constructor(public bucketName: string, public name: string) {}

  private get filePath() {
    return safeJoin(this.bucketName, this.name);
  }
  private get metaPath() {
    return `${this.filePath}.meta.json`;
  }
  private readMeta(): Meta {
    try {
      return JSON.parse(fs.readFileSync(this.metaPath, "utf8"));
    } catch {
      return {};
    }
  }

  async exists(): Promise<[boolean]> {
    return [fs.existsSync(this.filePath)];
  }

  async getMetadata(): Promise<[any]> {
    const meta = this.readMeta();
    const { size } = fs.statSync(this.filePath);
    return [{ ...meta, size }];
  }

  async setMetadata(update: Meta): Promise<void> {
    const meta = this.readMeta();
    const merged: Meta = {
      ...meta,
      ...update,
      metadata: { ...(meta.metadata || {}), ...(update.metadata || {}) },
    };
    fs.writeFileSync(this.metaPath, JSON.stringify(merged));
  }

  createReadStream() {
    return fs.createReadStream(this.filePath);
  }

  async save(data: Buffer, contentType?: string) {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, data);
    await this.setMetadata({ contentType });
  }
}

export const localObjectStorageClient = {
  bucket(bucketName: string) {
    return {
      file(objectName: string) {
        return new LocalFile(bucketName, objectName);
      },
    };
  },
};

export function localSignedObjectURL(bucketName: string, objectName: string): string {
  return `${LOCAL_STORAGE_URL_PREFIX}/${bucketName}/${objectName}`;
}

// Accepts the browser's PUT of the raw file body, standing in for a signed URL.
export function registerLocalStorageRoutes(app: Express) {
  app.put(
    `${LOCAL_STORAGE_URL_PREFIX}/:bucket/:objectPath(*)`,
    express.raw({ type: () => true, limit: "50mb" }),
    async (req, res) => {
      try {
        const file = new LocalFile(req.params.bucket, req.params.objectPath);
        await file.save(req.body as Buffer, req.headers["content-type"]);
        res.sendStatus(200);
      } catch (err) {
        console.error("Local storage upload failed:", err);
        res.status(400).json({ error: "Upload failed" });
      }
    },
  );
}
