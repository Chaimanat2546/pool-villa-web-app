import { Suspense, type ReactNode } from "react";

import { requireRole } from "@/lib/auth/session";
import { AdminSidebarNav } from "./AdminSidebarNav";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <Suspense fallback={<AdminLayoutFallback />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: AdminLayoutProps) {
  const user = await requireRole("admin");

  return (
    <main className="admin-theme min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:px-6">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
            <div className="px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Admin
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-card-foreground">
                {user.email ?? user.id}
              </p>
            </div>

            <AdminSidebarNav />
          </div>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}

function AdminLayoutFallback() {
  return (
    <main className="admin-theme min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Loading admin...</p>
        </aside>
        <section className="min-w-0">
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </section>
      </div>
    </main>
  );
}
