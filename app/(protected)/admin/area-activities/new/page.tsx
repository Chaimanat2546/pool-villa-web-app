import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getAdminHouseSettingsData } from "@/lib/houses";
import { AreaActivityForm } from "../AreaActivityForm";

export default function AdminNewAreaActivityPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Suspense fallback={<p>Loading area activity form...</p>}>
        <NewAreaActivity />
      </Suspense>
    </div>
  );
}

async function NewAreaActivity() {
  await requireRole("admin");
  const settings = await getAdminHouseSettingsData();

  if (settings.areas.length === 0) {
    notFound();
  }

  return (
    <>
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Admin dashboard
        </p>
        <h1 className="text-3xl font-bold text-primary">New Area Activity</h1>
      </div>
      <AreaActivityForm mode="create" areas={settings.areas} />
    </>
  );
}
