// LOCAL_DEV=1 only: stands in for @clerk/react, @clerk/react/internal and
// @clerk/themes (see the aliases in vite.config.ts), because Replit-managed
// Clerk can't run off Replit. Everyone is the local admin user; the server side
// is in server/middlewares/requireAuth.ts. Never bundled in a production build.
import type { ReactNode } from "react";

const user = {
  id: "local-dev-user",
  firstName: "Local",
  lastName: "Developer",
  fullName: "Local Developer",
  imageUrl: "",
  hasImage: false,
  primaryEmailAddress: { emailAddress: "dev@localhost" },
  emailAddresses: [{ emailAddress: "dev@localhost" }],
  update: async () => user,
  reload: async () => user,
};

export const useUser = () => ({ user, isSignedIn: true, isLoaded: true });

export const useAuth = () => ({
  userId: user.id,
  isSignedIn: true,
  isLoaded: true,
  getToken: async () => null,
  signOut: async () => {},
});

export const useClerk = () => ({
  addListener: () => () => {},
  signOut: async () => {},
  openUserProfile: () => {},
});

export const ClerkProvider = ({ children }: { children: ReactNode; [key: string]: unknown }) => <>{children}</>;

const LocalSignInNotice = (_props: Record<string, unknown>) => (
  <p className="text-muted-foreground">Local mode: you're already signed in as the local admin.</p>
);
export const SignIn = LocalSignInNotice;
export const SignUp = LocalSignInNotice;

export const publishableKeyFromHost = () => "pk_local_dev";
export const shadcn = {};
