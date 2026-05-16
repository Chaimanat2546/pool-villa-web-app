"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  HouseRecommendation,
  HouseRecommendationStatus,
} from "@/lib/house-recommendations";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RecommendationManagerProps = {
  recommendations: HouseRecommendation[];
};

type RecommendationDraft = {
  hId: string;
  startsAt: string;
  endsAt: string | null;
  status: HouseRecommendationStatus;
};

type RecommendationDraftState = {
  source: HouseRecommendation[];
  drafts: Record<string, RecommendationDraft>;
};

function getDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultEndDateValue() {
  const startsAt = new Date();
  const endsAt = new Date();
  endsAt.setDate(startsAt.getDate() + 7);

  return getDateInputValue(endsAt);
}

function getInitialCreateDraft(): RecommendationDraft {
  const startsAt = new Date();

  return {
    hId: "",
    startsAt: getDateInputValue(startsAt),
    endsAt: getDefaultEndDateValue(),
    status: "hidden",
  };
}

function createDraftMap(recommendations: HouseRecommendation[]) {
  return Object.fromEntries(
    recommendations.map((recommendation) => [
      recommendation.id,
      {
        hId: recommendation.hId,
        startsAt: recommendation.startsAt,
        endsAt: recommendation.endsAt,
        status: recommendation.status,
      },
    ]),
  );
}

function toPayload(draft: RecommendationDraft) {
  return {
    h_id: draft.hId,
    starts_at: draft.startsAt,
    ends_at: draft.endsAt || null,
    status: draft.status,
  };
}

function hasDraftChanges(
  recommendation: HouseRecommendation,
  draft: RecommendationDraft,
) {
  return (
    recommendation.hId !== draft.hId ||
    recommendation.startsAt !== draft.startsAt ||
    recommendation.endsAt !== draft.endsAt ||
    recommendation.status !== draft.status
  );
}

async function readApiResponse(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  if (!response.ok) {
    throw new Error(body?.error ?? "Request failed.");
  }
}

export function RecommendationManager({
  recommendations,
}: RecommendationManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createDraft, setCreateDraft] = useState(getInitialCreateDraft);
  const [draftState, setDraftState] = useState<RecommendationDraftState>(() => ({
    source: recommendations,
    drafts: createDraftMap(recommendations),
  }));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  let drafts = draftState.drafts;

  if (draftState.source !== recommendations) {
    drafts = createDraftMap(recommendations);
    setDraftState({ source: recommendations, drafts });
  }

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch("/api/house-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(createDraft)),
      });

      await readApiResponse(response);
      setCreateDraft(getInitialCreateDraft());
      setFeedback("สร้างรายการแล้ว");
      refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Request failed.");
    }
  }

  async function updateRecommendation(id: string) {
    const draft = drafts[id];
    if (!draft) return;

    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/api/house-recommendations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(draft)),
      });

      await readApiResponse(response);
      setFeedback("บันทึกแล้ว");
      refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Request failed.");
    }
  }

  async function deleteRecommendation(id: string) {
    if (!window.confirm("Delete this recommendation?")) return;

    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/api/house-recommendations/${id}`, {
        method: "DELETE",
      });

      await readApiResponse(response);
      setFeedback("ลบแล้ว");
      refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Request failed.");
    }
  }

  function setDraftField(
    id: string,
    field: keyof RecommendationDraft,
    value: RecommendationDraft[keyof RecommendationDraft],
  ) {
    setDraftState((current) => ({
      source: current.source,
      drafts: {
        ...current.drafts,
        [id]: {
          ...current.drafts[id],
          [field]: value,
        },
      },
    }));
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={submitCreate}
        className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_160px_auto] md:items-start">
          <div className="grid gap-2">
            <Label htmlFor="create-h-id">รหัสบ้าน</Label>
            <Input
              id="create-h-id"
              value={createDraft.hId}
              onChange={(event) =>
                setCreateDraft((current) => ({
                  ...current,
                  hId: event.target.value,
                }))
              }
              placeholder="123"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-starts-at">วันเริ่ม</Label>
            <Input
              id="create-starts-at"
              type="date"
              value={createDraft.startsAt}
              onChange={(event) =>
                setCreateDraft((current) => ({
                  ...current,
                  startsAt: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-ends-at">วันหมดอายุ</Label>
            <Input
              id="create-ends-at"
              type="date"
              value={createDraft.endsAt ?? ""}
              onChange={(event) =>
                setCreateDraft((current) => ({
                  ...current,
                  endsAt: event.target.value || null,
                }))
              }
              disabled={createDraft.endsAt === null}
            />
            <label
              htmlFor="create-no-expiry"
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Checkbox
                id="create-no-expiry"
                checked={createDraft.endsAt === null}
                onCheckedChange={(checked) =>
                  setCreateDraft((current) => ({
                    ...current,
                    endsAt: checked === true ? null : getDefaultEndDateValue(),
                  }))
                }
              />
              ไม่มีวันหมดอายุ
            </label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-status">สถานะ</Label>
            <select
              id="create-status"
              value={createDraft.status}
              onChange={(event) =>
                setCreateDraft((current) => ({
                  ...current,
                  status: event.target.value as HouseRecommendationStatus,
                }))
              }
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="hidden">ไม่แสดง</option>
              <option value="visible">แสดง</option>
            </select>
          </div>

          <Button type="submit" className="mt-5" disabled={isPending}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            เพิ่ม
          </Button>
        </div>

        {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <div className="grid min-w-[820px] grid-cols-[120px_1fr_1fr_150px_160px] items-center gap-16 border-b border-border bg-muted/50 px-4 py-3 text-sm font-medium text-primary">
          <span>รหัสบ้าน</span>
          <span>วันเริ่ม</span>
          <span>วันหมดอายุ</span>
          <span>สถานะ</span>
          <span>จัดการ</span>
        </div>

        {recommendations.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            ยังไม่มีรายการ
          </p>
        ) : (
          <div className="divide-y divide-border">
            {[...recommendations].sort((a, b) => {
              const draftA = drafts[a.id];
              const draftB = drafts[b.id];

              if (!draftA || !draftB) return 0;

              // visible ขึ้นก่อน hidden
              if (a.status === "visible" && b.status === "hidden") {
                return -1;
              }

              if (a.status === "hidden" && b.status === "visible") {
                return 1;
              }

              return 0;
            }).map((recommendation) => {
              const draft = drafts[recommendation.id];
              if (!draft) return null;
              const isDirty = hasDraftChanges(recommendation, draft);

              return (
                <div
                  key={recommendation.id}
                  className={`grid min-w-[820px] grid-cols-[120px_1fr_1fr_150px_160px] gap-12 px-4 py-3 ${isDirty ? "bg-muted/70" : ""}`}
                >
                  <Input
                    value={draft.hId}
                    onChange={(event) =>
                      setDraftField(
                        recommendation.id,
                        "hId",
                        event.target.value,
                      )
                    }
                  />
                  <Input
                    type="date"
                    value={draft.startsAt}
                    onChange={(event) =>
                      setDraftField(
                        recommendation.id,
                        "startsAt",
                        event.target.value,
                      )
                    }
                  />
                  <div className="grid gap-2 items-start">
                    <Input
                      type="date"
                      value={draft.endsAt ?? ""}
                      onChange={(event) =>
                        setDraftField(
                          recommendation.id,
                          "endsAt",
                          event.target.value || null,
                        )
                      }
                      disabled={draft.endsAt === null}
                    />
                    <label className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Checkbox
                        checked={draft.endsAt === null}
                        onCheckedChange={(checked) =>
                          setDraftField(
                            recommendation.id,
                            "endsAt",
                            checked === true ? null : getDefaultEndDateValue(),
                          )
                        }
                      />
                      ไม่มีวันหมดอายุ
                    </label>
                  </div>
                  <div className="flex items-start gap-2">
                    <select
                      value={draft.status}
                      onChange={(event) =>
                        setDraftField(
                          recommendation.id,
                          "status",
                          event.target.value,
                        )
                      }
                      className={`${draft.status === "hidden" ? "text-muted-foreground" : ""} h-9 min-w-24 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`}
                    >
                      <option value="hidden">ไม่แสดง</option>
                      <option value="visible">แสดง</option>
                    </select>

                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => updateRecommendation(recommendation.id)}
                      disabled={isPending}
                      aria-label="Save recommendation"
                      className=" hover:bg-brand hover:text-brand-foreground"
                    >
                      <Save className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() => deleteRecommendation(recommendation.id)}
                      disabled={isPending}
                      aria-label="Delete recommendation"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
