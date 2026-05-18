import { Suspense } from "react";
import { getAdminAccommodationRecommendations } from "@/lib/accommodation-recommendations";
import { getAdminHouseSummaries } from "@/lib/houses";
import { requireRole } from "@/lib/auth/session";
import { AccommodationRecommendationManager } from "./AccommodationRecommendationManager";

export default function AdminAccommodationRecommendationsPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Admin dashboard
        </p>
        <h1 className="text-3xl font-bold text-primary">บ้านแนะนำ (ระบบ)</h1>
      </div>

      <Suspense fallback={<p>Loading recommendations...</p>}>
        <AdminRecommendations />
      </Suspense>
    </div>
  );
}

async function AdminRecommendations() {
  await requireRole("admin");

  const [recommendations, houses] = await Promise.all([
    getAdminAccommodationRecommendations(),
    getAdminHouseSummaries({ status: "all" }),
  ]);

  return (
    <AccommodationRecommendationManager
      recommendations={recommendations}
      houses={houses}
    />
  );
}
