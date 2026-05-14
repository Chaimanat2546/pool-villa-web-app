import { Suspense } from "react";
import { getAdminHouseRecommendations } from "@/lib/house-recommendations";
import { requireRole } from "@/lib/auth/session";
import { RecommendationManager } from "./RecommendationManager";

export default function AdminRecommendationsPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Admin dashboard
        </p>
        <h1 className="text-3xl font-bold">บ้านแนะนำ</h1>
      </div>

      <Suspense fallback={<p>Loading recommendations...</p>}>
        <AdminRecommendations />
      </Suspense>
    </div>
  );
}

async function AdminRecommendations() {
  await requireRole("admin");
  const recommendations = await getAdminHouseRecommendations();

  return <RecommendationManager recommendations={recommendations} />;
}
