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
  // LOCAL_DEV=1 (server bound to 127.0.0.1): no Clerk, always the local admin.
  if (process.env.LOCAL_DEV === "1") {
    try {
      const values = { id: "local-dev-user", email: "dev@localhost", firstName: "Local", lastName: "Developer", role: "admin" };
      const [dbUser] = await db.insert(users).values(values)
        .onConflictDoUpdate({ target: users.id, set: { role: "admin" } }).returning();
      req.dbUser = dbUser;
      req.authEmail = values.email;
      next();
    } catch (error) {
      next(error);
    }
    return;
  }
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
