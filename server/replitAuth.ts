// Replit Auth integration - from blueprint:javascript_log_in_with_replit
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// LOCAL_DEV=1 replaces Replit OIDC with a one-click fake login for local work.
const isLocalDev = process.env.LOCAL_DEV === "1";

if (!isLocalDev && !process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions", // Match our table name
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: !isLocalDev,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"], // Use Replit user ID as primary key
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  if (isLocalDev) {
    setupLocalDevAuth(app);
    return;
  }

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
// Local-only stand-in for Replit login: /api/login signs in a fixed dev user
// with a far-future expiry so isAuthenticated() passes without token refresh.
function setupLocalDevAuth(app: Express) {
  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  const claims = {
    sub: "local-dev-user",
    email: "dev@localhost",
    first_name: "Local",
    last_name: "Developer",
    profile_image_url: null,
  };

  app.get("/api/login", async (req, res, next) => {
    try {
      await upsertUser(claims);
      // The local dev user is always an admin so the admin UI is reachable.
      await storage.updateUser(claims.sub, { role: "admin" } as any);
      const user = {
        claims,
        access_token: "local-dev",
        refresh_token: undefined,
        expires_at: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
      };
      req.login(user, (err) => {
        if (err) return next(err);
        res.redirect("/");
      });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/callback", (_req, res) => res.redirect("/"));

  app.get("/api/logout", (req, res) => {
    req.logout(() => res.redirect("/"));
  });
}

// Allows the request only for a signed-in user whose role is "admin".
// Signed-out → 401, signed in without admin role → 403.
export const isAdmin: RequestHandler = (req, res, next) => {
  isAuthenticated(req, res, async (err?: any) => {
    if (err) return next(err);
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = userId ? await storage.getUser(userId) : undefined;
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    } catch (error) {
      next(error);
    }
  });
};
