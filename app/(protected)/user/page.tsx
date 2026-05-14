import { Suspense } from "react";
import { requireRole } from "@/lib/auth/session";

export default function UserPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-6">
      <Suspense fallback={<p>Loading user dashboard...</p>}>
        <UserDashboard />
      </Suspense>
    </main>
  );
}

async function UserDashboard() {
  const user = await requireRole("user");

  return (
    <>
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          User dashboard
        </p>
        <h1 className="text-3xl font-bold">User area</h1>
      </div>

      <section className="rounded-lg border p-5">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="font-medium">{user.email ?? user.id}</p>
        <p className="mt-3 text-sm text-muted-foreground">Role</p>
        <p className="font-medium">{user.role}</p>
      </section>
    </>
  );
}
