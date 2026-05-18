import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAdminAreaActivityById } from "@/lib/area-activities";
import { requireRole } from "@/lib/auth/session";
import { getAdminHouseSettingsData } from "@/lib/houses";
import { AreaActivityForm } from "../AreaActivityForm";

type AdminEditAreaActivityPageProps = {
  params: Promise<{ id: string }>;
};

export default function AdminEditAreaActivityPage({
  params,
}: AdminEditAreaActivityPageProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Suspense fallback={<p>Loading area activity...</p>}>
        <EditAreaActivity params={params} />
      </Suspense>
    </div>
  );
}

async function EditAreaActivity({ params }: AdminEditAreaActivityPageProps) {
  await requireRole("admin");
  const { id } = await params;

  const [activity, settings] = await Promise.all([
    getAdminAreaActivityById(id),
    getAdminHouseSettingsData(),
  ]);

  if (!activity) {
    notFound();
  }

  return (
    <>
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Admin dashboard
        </p>
        <h1 className="text-3xl font-bold text-primary">{activity.title}</h1>
      </div>
      <AreaActivityForm mode="edit" activity={activity} areas={settings.areas} />
    </>
  );
}
