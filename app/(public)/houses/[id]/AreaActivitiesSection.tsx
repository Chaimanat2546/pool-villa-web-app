"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AreaActivity, AreaActivityApiData } from "@/lib/area-activities";
import { Button } from "@/components/ui/button";

type AreaActivitiesSectionProps = {
  areaId: string;
  activities: AreaActivity[];
  totalCount: number;
  pageSize: number;
};

function formatDateRange(activity: AreaActivity) {
  const startsAt = new Date(`${activity.startsAt}T00:00:00`);
  const startText = startsAt.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!activity.endsAt) return `${startText} เป็นต้นไป`;

  const endsAt = new Date(`${activity.endsAt}T00:00:00`);
  const endText = endsAt.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${startText} - ${endText}`;
}

function mapAreaActivityApiData(activity: AreaActivityApiData): AreaActivity {
  return {
    id: activity.id,
    title: activity.title,
    startsAt: activity.starts_at,
    endsAt: activity.ends_at,
    status: activity.status,
    createdBy: activity.created_by,
    createdAt: activity.created_at,
    updatedAt: activity.updated_at,
    areas: activity.areas.map((area) => ({
      activityId: area.activity_id,
      areaId: area.area_id,
      areaName: area.area_name,
      zoneName: area.zone_name,
      provinceName: area.province_name,
    })),
    images: activity.images.map((image) => ({
      id: image.id,
      activityId: image.activity_id,
      storagePath: image.storage_path,
      publicUrl: image.public_url,
      altText: image.alt_text,
      sortOrder: image.sort_order,
      createdAt: image.created_at,
      updatedAt: image.updated_at,
    })),
  };
}

export function AreaActivitiesSection({
  areaId,
  activities,
  totalCount,
  pageSize,
}: AreaActivitiesSectionProps) {
  const [page, setPage] = useState(1);
  const [currentActivities, setCurrentActivities] = useState(activities);
  const [currentTotalCount, setCurrentTotalCount] = useState(totalCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(currentTotalCount / pageSize));

  async function loadPage(nextPage: number) {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        area_id: areaId,
        page: String(nextPage),
        page_size: String(pageSize),
      });
      const response = await fetch(`/api/area-activities?${params.toString()}`);
      const body = (await response.json().catch(() => null)) as {
        data?: AreaActivityApiData[];
        meta?: { total_count?: number };
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "Request failed.");
      }

      setCurrentActivities((body?.data ?? []).map(mapAreaActivityApiData));
      setCurrentTotalCount(body?.meta?.total_count ?? 0);
      setPage(nextPage);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  if (currentActivities.length === 0 && currentTotalCount === 0) return null;

  return (
    <section className="mt-6 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">กิจกรรมแนะนำ</h2>
        {totalPages > 1 ? (
          <span className="text-xs text-muted-foreground">
            {page}/{totalPages}
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {currentActivities.map((activity) => {
          const image = activity.images[0];
          return (
            <article
              key={activity.id}
              className="overflow-hidden rounded-md border border-border bg-background"
            >
              {image ? (
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={image.publicUrl}
                    alt={image.altText ?? activity.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 320px"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="grid gap-1 p-3">
                <h3 className="text-sm font-semibold text-card-foreground">
                  {activity.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatDateRange(activity)}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => loadPage(Math.max(1, page - 1))}
            disabled={page === 1 || isLoading}
            aria-label="Previous activities"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => loadPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || isLoading}
            aria-label="Next activities"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
