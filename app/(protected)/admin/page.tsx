import { Suspense } from "react";
import { requireRole } from "@/lib/auth/session";

export default function AdminPage() {
  return (
    <div className="flex w-full max-w-5xl flex-col gap-6">
      <Suspense fallback={<p>Loading admin dashboard...</p>}>
        <AdminDashboard />
      </Suspense>
    </div>
  );
}

async function AdminDashboard() {
  const user = await requireRole("admin");

  return (
    <>
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Admin dashboard
        </p>
        <h1 className="text-3xl font-bold text-primary">Admin area</h1>
      </div>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="font-medium text-primary">{user.email ?? user.id}</p>
        <p className="mt-3 text-sm text-muted-foreground">Role</p>
        <p className="font-medium text-primary">{user.role}</p>
      </section>
    </>
  );
}
