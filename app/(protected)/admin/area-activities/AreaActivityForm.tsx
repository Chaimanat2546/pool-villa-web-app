"use client";

import Image from "next/image";
import { ImagePlus, Save, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { AreaActivity, AreaActivityStatus } from "@/lib/area-activities";
import type { AdminHouseAreaOption } from "@/lib/houses";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AreaActivityFormProps = {
  mode: "create" | "edit";
  areas: AdminHouseAreaOption[];
  activity?: AreaActivity;
};

type ActivityDraft = {
  title: string;
  areaIds: string[];
  startsAt: string;
  endsAt: string | null;
  status: AreaActivityStatus;
};

const DEFAULT_STATUS: AreaActivityStatus = "hidden";

function getDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toDraft(activity?: AreaActivity): ActivityDraft {
  if (!activity) {
    return {
      title: "",
      areaIds: [],
      startsAt: getDateInputValue(new Date()),
      endsAt: null,
      status: DEFAULT_STATUS,
    };
  }

  return {
    title: activity.title,
    areaIds: activity.areas.map((area) => area.areaId),
    startsAt: activity.startsAt,
    endsAt: activity.endsAt,
    status: activity.status,
  };
}

function toPayload(draft: ActivityDraft) {
  return {
    title: draft.title,
    area_ids: draft.areaIds,
    starts_at: draft.startsAt,
    ends_at: draft.endsAt || null,
    status: draft.status,
  };
}

async function readApiResponse(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) throw new Error(body?.error ?? "Request failed.");
  return body;
}

export function AreaActivityForm({ mode, areas, activity }: AreaActivityFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState(() => toDraft(activity));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [areaQuery, setAreaQuery] = useState("");
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaZoneId, setNewAreaZoneId] = useState("");
  const [isAddAreaOpen, setIsAddAreaOpen] = useState(false);
  const [isAreaMenuOpen, setIsAreaMenuOpen] = useState(false);
  const blurTimeoutRef = useRef<number | null>(null);
  const [areaOptions, setAreaOptions] = useState(areas);

  const areaAutocompleteOptions = useMemo(
    () =>
      areaOptions.map((area) => ({
        id: area.id,
        label: [area.provinceName, area.zoneName, area.name].filter(Boolean).join(" / "),
      })),
    [areaOptions],
  );
  const areaLabelByIdMap = useMemo(
    () => new Map(areaAutocompleteOptions.map((option) => [option.id, option.label])),
    [areaAutocompleteOptions],
  );
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) window.clearTimeout(blurTimeoutRef.current);
    };
  }, []);
  const uniqueZoneOptions = useMemo(() => {
    const map = new Map<string, string>();
    areaOptions.forEach((area) => {
      if (area.accommodationZoneId && area.zoneName) {
        map.set(area.accommodationZoneId, [area.provinceName, area.zoneName].filter(Boolean).join(" / "));
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [areaOptions]);

  function addAreaId(areaId: string) {
    setDraft((current) => ({
      ...current,
      areaIds: current.areaIds.includes(areaId)
        ? current.areaIds
        : [...current.areaIds, areaId],
    }));
  }

  function removeAreaId(areaId: string) {
    setDraft((current) => ({
      ...current,
      areaIds: current.areaIds.filter((id) => id !== areaId),
    }));
  }

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    try {
      if (mode === "create") {
        const response = await fetch("/api/admin/area-activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload(draft)),
        });
        const body = (await readApiResponse(response)) as { data?: { id?: string } } | null;
        const createdId = body?.data?.id;
        if (createdId) {
          router.push(`/admin/area-activities/${createdId}`);
          router.refresh();
          return;
        }
        setFeedback("Created activity.");
        setDraft(toDraft(undefined));
      } else if (activity) {
        const response = await fetch(`/api/admin/area-activities/${activity.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload(draft)),
        });
        await readApiResponse(response);
        setFeedback("Saved activity.");
        refresh();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request failed.");
    }
  }

  async function deleteActivity() {
    if (!activity || !window.confirm("Delete this activity?")) return;

    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/area-activities/${activity.id}`, {
        method: "DELETE",
      });
      await readApiResponse(response);
      router.push("/admin/area-activities");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Request failed.");
    }
  }

  async function uploadImages(fileList: FileList | null) {
    if (!activity || !fileList || fileList.length === 0) return;
    setError(null);
    setFeedback(null);
    setUploading(true);

    try {
      const formData = new FormData();
      Array.from(fileList).forEach((file) => formData.append("files", file));
      const response = await fetch(`/api/admin/area-activities/${activity.id}/images`, {
        method: "POST",
        body: formData,
      });
      await readApiResponse(response);
      setFeedback("Uploaded images.");
      refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Request failed.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteImage(imageId: string) {
    if (!activity) return;
    setError(null);
    setFeedback(null);
    setDeletingImageId(imageId);

    try {
      const response = await fetch(`/api/admin/area-activities/${activity.id}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [imageId] }),
      });
      await readApiResponse(response);
      setFeedback("Deleted image.");
      refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Request failed.");
    } finally {
      setDeletingImageId(null);
    }
  }

  async function addNewArea() {
    if (!newAreaName.trim() || !newAreaZoneId) return;
    setError(null);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/houses/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "area",
          name: newAreaName.trim(),
          accommodation_zone_id: newAreaZoneId,
        }),
      });
      const body = (await readApiResponse(response)) as { data?: { id?: string } } | null;
      const id = body?.data?.id;
      if (!id) throw new Error("Area created but id missing.");
      const zoneRef = uniqueZoneOptions.find((item) => item.id === newAreaZoneId);
      const zoneParts = (zoneRef?.label ?? "").split(" / ");
      const nextArea: AdminHouseAreaOption = {
        id,
        name: newAreaName.trim(),
        accommodationZoneId: newAreaZoneId,
        provinceName: zoneParts[0] ?? null,
        zoneName: zoneParts[1] ?? null,
      };
      setAreaOptions((current) => [nextArea, ...current]);
      setDraft((current) => ({ ...current, areaIds: [...current.areaIds, id] }));
      setNewAreaName("");
      setNewAreaZoneId("");
      setFeedback("Added area.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Request failed.");
    }
  }

  const imageCount = activity?.images.length ?? 0;
  const imageLimitReached = imageCount >= 2;

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm"
      >
        <div className="grid gap-2">
          <Label htmlFor="activity-title">Title</Label>
          <Input
            id="activity-title"
            value={draft.title}
            onChange={(event) =>
              setDraft((current) => ({ ...current, title: event.target.value }))
            }
            required
          />
        </div>

        <div className="grid gap-2">
          <Label>Areas</Label>
          <div className="relative">
            <Input
              placeholder="พิมพ์เพื่อค้นหา"
              value={areaQuery}
              onChange={(event) => {
                setAreaQuery(event.target.value);
                setIsAreaMenuOpen(true);
              }}
              onFocus={() => setIsAreaMenuOpen(true)}
              onBlur={() => {
                blurTimeoutRef.current = window.setTimeout(() => setIsAreaMenuOpen(false), 120);
              }}
            />
            {isAreaMenuOpen ? (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-card shadow-sm">
                {areaAutocompleteOptions
                  .filter((option) => option.label.toLowerCase().includes(areaQuery.toLowerCase()))
                  .map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-muted"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        addAreaId(option.id);
                        setAreaQuery("");
                        setIsAreaMenuOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 rounded-md border border-border p-3">
            {draft.areaIds.map((areaId) => (
              <button key={areaId} type="button" className="rounded-md border border-border bg-background px-2 py-1 text-xs" onClick={() => removeAreaId(areaId)}>
                {areaLabelByIdMap.get(areaId) ?? areaId} x
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Button type="button" variant="outline" onClick={() => setIsAddAreaOpen((current) => !current)}>
              <ImagePlus aria-hidden />
              {isAddAreaOpen ? "Hide add area" : "Add new area"}
            </Button>
            {isAddAreaOpen ? (
              <div className="grid gap-2 rounded-md border border-dashed border-border p-3 md:grid-cols-[1fr_1fr_auto]">
                <Input
                  placeholder="New area name"
                  value={newAreaName}
                  onChange={(event) => setNewAreaName(event.target.value)}
                />
                <select
                  value={newAreaZoneId}
                  onChange={(event) => setNewAreaZoneId(event.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select zone</option>
                  {uniqueZoneOptions.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.label}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="outline" onClick={addNewArea}>
                  <Save aria-hidden />
                  Add
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="starts-at">Starts at</Label>
            <Input
              id="starts-at"
              type="date"
              value={draft.startsAt}
              onChange={(event) =>
                setDraft((current) => ({ ...current, startsAt: event.target.value }))
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ends-at">Ends at</Label>
            <Input
              id="ends-at"
              type="date"
              value={draft.endsAt ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  endsAt: event.target.value || null,
                }))
              }
              disabled={draft.endsAt === null}
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={draft.endsAt === null}
                onCheckedChange={(checked) =>
                  setDraft((current) => ({
                    ...current,
                    endsAt: checked === true ? null : getDateInputValue(new Date()),
                  }))
                }
              />
              <span>No expiry</span>
            </label>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={draft.status}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  status: event.target.value as AreaActivityStatus,
                }))
              }
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="hidden">Hidden</option>
              <option value="visible">Visible</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending}>
            <Save aria-hidden />
            {mode === "create" ? "Create activity" : "Save"}
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/admin/area-activities">Back to list</Link>
          </Button>
          {mode === "edit" ? (
            <Button type="button" variant="destructive" disabled={isPending} onClick={deleteActivity}>
              <Trash2 aria-hidden />
              Delete
            </Button>
          ) : null}
        </div>
      </form>

      {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {activity ? (
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-card-foreground">Images ({imageCount}/2)</p>
          {activity.images.length > 0 ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {activity.images.map((image) => (
                <div key={image.id} className="rounded-md border border-border p-2">
                  <div className="relative aspect-[4/3] overflow-hidden rounded">
                    <Image
                      src={image.publicUrl}
                      alt={image.altText ?? activity.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 280px"
                      className="object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="mt-2 w-full"
                    disabled={deletingImageId === image.id}
                    onClick={() => deleteImage(image.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                    Delete image
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <ImagePlus className="h-4 w-4" aria-hidden />
              <span>Upload images</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                disabled={imageLimitReached || uploading}
                onChange={(event) => uploadImages(event.target.files)}
              />
            </label>
            {uploading ? (
              <p className="mt-2 inline-flex items-center text-sm text-muted-foreground">
                <Upload className="mr-1 h-4 w-4" aria-hidden />
                Uploading...
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
