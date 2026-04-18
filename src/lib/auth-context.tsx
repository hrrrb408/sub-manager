"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { type ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

export function useAuth() {
  const { data: session, status } = useSession();
  return {
    user: session?.user ?? null,
    loading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
