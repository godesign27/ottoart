import { useEffect, useRef, type ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { useLocation } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
export const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");

const clerkAppearance = {
  theme: shadcn,
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#2563eb", colorForeground: "#0f172a",
    colorMutedForeground: "#475569", colorDanger: "#b91c1c",
    colorBackground: "#ffffff", colorInput: "#ffffff",
    colorInputForeground: "#0f172a", colorNeutral: "#64748b",
    fontFamily: "Inter, sans-serif", borderRadius: "0.75rem",
  },
  elements: {
    rootBox: { width: "100%", display: "flex", justifyContent: "center" },
    cardBox: { backgroundColor: "#fff", width: "440px", maxWidth: "100%", borderRadius: "1rem", overflow: "hidden" },
    card: { boxShadow: "none", border: "0", backgroundColor: "transparent" },
    footer: { boxShadow: "none", border: "0", backgroundColor: "transparent" },
    headerTitle: { color: "#0f172a" }, headerSubtitle: { color: "#475569" },
    socialButtonsBlockButtonText: { color: "#0f172a" }, formFieldLabel: { color: "#0f172a" },
    footerActionLink: { color: "#1d4ed8" }, footerActionText: { color: "#475569" },
    dividerText: { color: "#475569" }, identityPreviewEditButton: { color: "#1d4ed8" },
    formFieldSuccessText: { color: "#166534" }, alertText: { color: "#991b1b" },
    logoBox: { height: "52px" }, logoImage: { height: "44px" },
    socialButtonsBlockButton: { backgroundColor: "#f8fafc", borderColor: "#cbd5e1" },
    formButtonPrimary: { backgroundColor: "#2563eb", color: "#fff" },
    formFieldInput: { backgroundColor: "#fff", color: "#0f172a", borderColor: "#94a3b8" },
    footerAction: { backgroundColor: "#f8fafc" }, dividerLine: { backgroundColor: "#cbd5e1" },
    alert: { backgroundColor: "#fef2f2" }, otpCodeFieldInput: { color: "#0f172a", backgroundColor: "#fff" },
    formFieldRow: { marginBottom: "16px" }, main: { gap: "20px" },
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) queryClient.clear();
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);
  return null;
}

export function SignInPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
    <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
  </div>;
}
export function SignUpPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
    <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
  </div>;
}
export function ClerkProviderWithRoutes({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Sign in to your Otto Art account" } },
        signUp: { start: { title: "Join Otto Art", subtitle: "Save your favorite art and manage your purchases" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        {children}
      </QueryClientProvider>
    </ClerkProvider>
  );
}
