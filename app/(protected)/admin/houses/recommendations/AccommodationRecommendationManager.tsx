"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  AccommodationRecommendation,
  AccommodationRecommendationStatus,
} from "@/lib/accommodation-recommendations";
import type { AdminHouseSummary } from "@/lib/houses";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AccommodationRecommendationManagerProps = {
  recommendations: AccommodationRecommendation[];
  houses: AdminHouseSummary[];
};

type RecommendationDraft = {
  accommodationId: string;
  startsAt: string;
  endsAt: string | null;
  status: AccommodationRecommendationStatus;
};

const DEFAULT_STATUS: AccommodationRecommendationStatus = "hidden";

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
    accommodationId: "",
    startsAt: getDateInputValue(startsAt),
    endsAt: getDefaultEndDateValue(),
    status: DEFAULT_STATUS,
  };
}

function createDraftMap(recommendations: AccommodationRecommendation[]) {
  return Object.fromEntries(
    recommendations.map((recommendation) => [
      recommendation.id,
      {
        accommodationId: recommendation.accommodationId,
        startsAt: recommendation.startsAt,
        endsAt: recommendation.endsAt,
        status: recommendation.status,
      },
    ]),
  );
}

function toPayload(draft: RecommendationDraft) {
  return {
    accommodation_id: draft.accommodationId,
    starts_at: draft.startsAt,
    ends_at: draft.endsAt || null,
    status: draft.status,
  };
}

function hasDraftChanges(
  recommendation: AccommodationRecommendation,
  draft: RecommendationDraft,
) {
  return (
    recommendation.accommodationId !== draft.accommodationId ||
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

function formatHouseLabel(house: AdminHouseSummary) {
  const statusLabel = house.status === "published" ? "เผยแพร่" : "ซ่อน";

  return `${house.code} - ${house.name} (${statusLabel})`;
}

function resolveAccommodationId(
  value: string,
  labelToId: Map<string, string>,
  idToLabel: Map<string, string>,
) {
  if (idToLabel.has(value)) return value;

  return labelToId.get(value) ?? "";
}

function filterHouseOptions(options: { id: string; label: string }[], query: string) {
  const trimmed = query.trim().toLowerCase();

  if (!trimmed) return options;

  return options.filter((option) => option.label.toLowerCase().includes(trimmed));
}

export function AccommodationRecommendationManager({
  recommendations,
  houses,
}: AccommodationRecommendationManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createDraft, setCreateDraft] = useState(getInitialCreateDraft);
  const [drafts, setDrafts] = useState(() => createDraftMap(recommendations));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createHouseInput, setCreateHouseInput] = useState("");
  const [rowHouseInputs, setRowHouseInputs] = useState<Record<string, string>>({});
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null);
  const hasHouseOptions = houses.length > 0;
  const blurTimeoutRef = useRef<number | null>(null);

  const houseOptions = useMemo(() => {
    return houses.map((house) => ({
      id: house.id,
      label: formatHouseLabel(house),
    }));
  }, [houses]);

  const houseMap = useMemo(() => {
    return new Map(houses.map((house) => [house.id, house]));
  }, [houses]);

  const houseLabelById = useMemo(() => {
    return new Map(houseOptions.map((option) => [option.id, option.label]));
  }, [houseOptions]);

  const houseIdByLabel = useMemo(() => {
    return new Map(houseOptions.map((option) => [option.label, option.id]));
  }, [houseOptions]);

  const [prevRecommendations, setPrevRecommendations] = useState(recommendations);

  if (recommendations !== prevRecommendations) {
    setPrevRecommendations(recommendations);
    setDrafts(createDraftMap(recommendations));
    setRowHouseInputs(
      Object.fromEntries(
        recommendations.map((recommendation) => [
          recommendation.id,
          houseLabelById.get(recommendation.accommodationId) ?? "",
        ]),
      ),
    );
  }

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    if (!createDraft.accommodationId) {
      setError("กรุณาเลือกบ้านพักจากรายการ");
      return;
    }

    try {
      const response = await fetch(
        "/api/admin/accommodations/recommendations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload(createDraft)),
        },
      );

      await readApiResponse(response);
      setCreateDraft(getInitialCreateDraft());
      setCreateHouseInput("");
      setFeedback("สร้างรายการแล้ว");
      refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Request failed.");
    }
  }

  async function updateRecommendation(id: string) {
    const draft = drafts[id];
    if (!draft) return;

    if (!draft.accommodationId) {
      setError("กรุณาเลือกบ้านพักจากรายการ");
      return;
    }

    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/admin/accommodations/recommendations/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload(draft)),
        },
      );

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
      const response = await fetch(
        `/api/admin/accommodations/recommendations/${id}`,
        {
          method: "DELETE",
        },
      );

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
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={submitCreate}
        className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr_160px_auto] md:items-start">
          <div className="grid gap-2">
            <Label htmlFor="create-accommodation">บ้านพัก</Label>
            <div className="relative">
              <Input
                id="create-accommodation"
                value={createHouseInput}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setCreateHouseInput(nextValue);
                  const resolvedId = resolveAccommodationId(
                    nextValue,
                    houseIdByLabel,
                    houseLabelById,
                  );
                  setCreateDraft((current) => ({
                    ...current,
                    accommodationId: resolvedId,
                  }));
                  setIsCreateMenuOpen(true);
                }}
                onFocus={() => setIsCreateMenuOpen(true)}
                onBlur={() => {
                  blurTimeoutRef.current = window.setTimeout(() => {
                    setIsCreateMenuOpen(false);
                  }, 120);
                }}
                placeholder={hasHouseOptions ? "พิมพ์เพื่อค้นหา" : "ยังไม่มีบ้านพัก"}
                required
                disabled={!hasHouseOptions}
              />
              {isCreateMenuOpen && hasHouseOptions ? (
                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-card shadow-sm">
                  {filterHouseOptions(houseOptions, createHouseInput).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-muted"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setCreateHouseInput(option.label);
                        setCreateDraft((current) => ({
                          ...current,
                          accommodationId: option.id,
                        }));
                        setIsCreateMenuOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                  {filterHouseOptions(houseOptions, createHouseInput).length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      ไม่พบบ้านพักที่ตรงกัน
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            {!createDraft.accommodationId && createHouseInput ? (
              <span className="text-xs text-destructive">
                กรุณาเลือกบ้านพักจากรายการ
              </span>
            ) : null}
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
                  status: event.target.value as AccommodationRecommendationStatus,
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

        {!hasHouseOptions ? (
          <p className="text-sm text-muted-foreground">
            ยังไม่มีบ้านพักในระบบเพื่อสร้างบ้านแนะนำ
          </p>
        ) : null}
        {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <div className="grid min-w-[920px] grid-cols-[1.6fr_1fr_1fr_150px_160px] items-center gap-16 border-b border-border bg-muted/50 px-4 py-3 text-sm font-medium text-primary">
          <span>บ้านพัก</span>
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
            {[...recommendations]
              .sort((a, b) => {
                if (a.status === "visible" && b.status === "hidden") {
                  return -1;
                }

                if (a.status === "hidden" && b.status === "visible") {
                  return 1;
                }

                return 0;
              })
              .map((recommendation) => {
                const draft = drafts[recommendation.id];
                if (!draft) return null;
                const isDirty = hasDraftChanges(recommendation, draft);
                const house = houseMap.get(draft.accommodationId);

                const rowInputValue =
                  rowHouseInputs[recommendation.id] ??
                  houseLabelById.get(draft.accommodationId) ??
                  "";
                const isRowMenuOpen = openRowMenuId === recommendation.id;

                return (
                  <div
                    key={recommendation.id}
                    className={`grid min-w-[920px] grid-cols-[1.6fr_1fr_1fr_150px_160px] gap-12 px-4 py-3 ${isDirty ? "bg-muted/70" : ""}`}
                  >
                    <div className="grid gap-2">
                      <div className="relative">
                        <Input
                          value={rowInputValue}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setRowHouseInputs((current) => ({
                              ...current,
                              [recommendation.id]: nextValue,
                            }));
                            const resolvedId = resolveAccommodationId(
                              nextValue,
                              houseIdByLabel,
                              houseLabelById,
                            );
                            setDraftField(
                              recommendation.id,
                              "accommodationId",
                              resolvedId,
                            );
                            setOpenRowMenuId(recommendation.id);
                          }}
                          onFocus={() => setOpenRowMenuId(recommendation.id)}
                          onBlur={() => {
                            blurTimeoutRef.current = window.setTimeout(() => {
                              setOpenRowMenuId((current) =>
                                current === recommendation.id ? null : current,
                              );
                            }, 120);
                          }}
                          placeholder="พิมพ์เพื่อค้นหา"
                        />
                        {isRowMenuOpen ? (
                          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-card shadow-sm">
                            {filterHouseOptions(houseOptions, rowInputValue).map(
                              (option) => (
                                <button
                                  key={option.id}
                                  type="button"
                                  className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-muted"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => {
                                    setRowHouseInputs((current) => ({
                                      ...current,
                                      [recommendation.id]: option.label,
                                    }));
                                    setDraftField(
                                      recommendation.id,
                                      "accommodationId",
                                      option.id,
                                    );
                                    setOpenRowMenuId(null);
                                  }}
                                >
                                  {option.label}
                                </button>
                              ),
                            )}
                            {filterHouseOptions(houseOptions, rowInputValue)
                              .length === 0 ? (
                              <div className="px-3 py-2 text-sm text-muted-foreground">
                                ไม่พบบ้านพักที่ตรงกัน
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      {!house ? (
                        <span className="text-xs text-destructive">
                          ไม่พบบ้านพักนี้ในระบบ
                        </span>
                      ) : null}
                      {!draft.accommodationId && rowInputValue ? (
                        <span className="text-xs text-destructive">
                          กรุณาเลือกบ้านพักจากรายการ
                        </span>
                      ) : null}
                    </div>
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
                              checked === true
                                ? null
                                : getDefaultEndDateValue(),
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
                        className="hover:bg-brand hover:text-brand-foreground"
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
