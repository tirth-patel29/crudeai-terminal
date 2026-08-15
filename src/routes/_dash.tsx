import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { useAuth } from "@/context/auth";

export const Route = createFileRoute("/_dash")({ component: DashLayout });

function DashLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/login" });
  }, [loading, user, navigate]);
  if (loading || !user)
    return (
      <div className="flex min-h-screen items-center justify-center text-xs text-muted-foreground">
        Loading terminal…
      </div>
    );
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
