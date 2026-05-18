import Link from "next/link";
import { Suspense } from "react";
import { Pencil, Plus } from "lucide-react";
import { getAdminAreaActivities, type AreaActivity } from "@/lib/area-activities";
import { requireRole } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminAreaActivitiesPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Admin dashboard
          </p>
          <h1 className="text-3xl font-bold text-primary">Area Activities</h1>
        </div>

        <Button asChild>
          <Link href="/admin/area-activities/new">
            <Plus aria-hidden />
            Add activity
          </Link>
        </Button>
      </div>

      <Suspense fallback={<p>Loading area activities...</p>}>
        <AdminAreaActivities />
      </Suspense>
    </div>
  );
}

async function AdminAreaActivities() {
  await requireRole("admin");
  const activities = await getAdminAreaActivities();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Total {activities.length} activities</p>
      {activities.length > 0 ? (
        <AreaActivityTable activities={activities} />
      ) : (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          No activities yet.
        </div>
      )}
    </div>
  );
}

function AreaActivityTable({ activities }: { activities: AreaActivity[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
      <div className="grid grid-cols-[1fr_130px_120px_100px] gap-4 border-b border-border bg-muted/40 px-4 py-3 text-sm font-medium text-muted-foreground">
        <span>Activity</span>
        <span>Status</span>
        <span>Updated</span>
        <span className="text-right">Manage</span>
      </div>

      <div className="divide-y divide-border">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="grid grid-cols-[1fr_130px_120px_100px] gap-4 px-4 py-4"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-card-foreground">{activity.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {activity.areas.length > 0
                  ? activity.areas
                      .map((area) =>
                        [area.provinceName, area.zoneName, area.areaName]
                          .filter(Boolean)
                          .join(" / "),
                      )
                      .join(", ")
                  : "-"}
              </p>
            </div>
            <div>
              {activity.status === "visible" ? (
                <Badge>Visible</Badge>
              ) : (
                <Badge variant="secondary">Hidden</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{activity.updatedAt.slice(0, 10)}</div>
            <div className="flex justify-end">
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/area-activities/${activity.id}`}>
                  <Pencil aria-hidden />
                  Edit
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
