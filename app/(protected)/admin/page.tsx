import { Suspense } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";

export default function AdminPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-6">
      <Suspense fallback={<p>Loading admin dashboard...</p>}>
        <AdminDashboard />
      </Suspense>
    </main>
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
        <h1 className="text-3xl font-bold">Admin area</h1>
      </div>

      <section className="rounded-lg border p-5">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="font-medium">{user.email ?? user.id}</p>
        <p className="mt-3 text-sm text-muted-foreground">Role</p>
        <p className="font-medium">{user.role}</p>
      </section>

      <section className="rounded-lg border p-5">
        <h2 className="mb-3 text-xl font-semibold">จัดการระบบ</h2>
        <Link
          href="/admin/recommendations"
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          บ้านแนะนำ
        </Link>
        <Link
          href="/admin/blog"
          className="ml-3 inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent"
        >
          บทความ
        </Link>
      </section>
    </>
  );
}
