import type { RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, type User } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      dbUser: User;
    }
  }
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  // The managed session claim preserves the original subject for migrated users.
  const userId = auth.sessionClaims?.userId;
  if (typeof userId !== "string" || !userId) {
    res.status(403).json({ message: "Account identity is unavailable. Please sign in again." });
    return;
  }
  try {
    let [dbUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!dbUser) {
      const [inserted] = await db.insert(users).values({ id: userId })
        .onConflictDoNothing().returning();
      if (inserted) dbUser = inserted;
      else [dbUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    }
    if (!dbUser) {
      res.status(403).json({ message: "Account access unavailable" });
      return;
    }
    req.dbUser = dbUser;
    next();
  } catch (error) {
    next(error);
  }
};
