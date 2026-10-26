import type { RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, type User } from "@shared/schema";
import { resolveSessionIdentity } from "../clerkIdentity";

declare global {
  namespace Express {
    interface Request {
      dbUser: User;
      authEmail: string | null;
    }
  }
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const { userId, email } = await resolveSessionIdentity(auth.userId, {
      userId: auth.sessionClaims?.userId,
      email: auth.sessionClaims?.email,
    });
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
    req.authEmail = email;
    next();
  } catch (error) {
    next(error);
  }
};
