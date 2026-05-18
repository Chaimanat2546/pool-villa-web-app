"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AccommodationStatus,
  AdminHouseCreateOptions,
  AdminHouseEditData,
} from "@/lib/houses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminHouseCalendar } from "./AdminHouseCalendar";
import {
  AdminHouseImageManager,
  type PendingHouseImageDraft,
} from "./AdminHouseImageManager";

type HouseCreateFormProps = {
  options: AdminHouseCreateOptions;
  house?: AdminHouseEditData;
};

type HouseFormResponse = {
  data?: {
    id?: string;
  };
  error?: string;
};

type HouseImageMutationResponse = {
  error?: string;
};

type ContactDraft = {
  id: string;
  name: string;
  phoneNumber: string;
  role: string;
  isPublic: boolean;
};

type DatePriceDraft = {
  id: string;
  stayDate: string;
  priceType: "special" | "holiday" | "pending" | "booked";
  price: string;
  agencyPrice: string;
  note: string;
  isActive: boolean;
};

const WEEKDAYS = [
  { value: 1, label: "จันทร์" },
  { value: 2, label: "อังคาร" },
  { value: 3, label: "พุธ" },
  { value: 4, label: "พฤหัส" },
  { value: 5, label: "ศุกร์" },
  { value: 6, label: "เสาร์" },
  { value: 7, label: "อาทิตย์" },
] as const;

const STATUS_OPTIONS: Array<{ value: AccommodationStatus; label: string }> = [
  { value: "published", label: "เผยแพร่" },
  { value: "archived", label: "ซ่อน" },
];

const POOL_TYPE_OPTIONS = [
  { value: "none", label: "ไม่มี" },
  { value: "private", label: "ส่วนตัว" },
  { value: "shared", label: "ใช้ร่วมกัน" },
] as const;

const POOL_SYSTEM_OPTIONS = [
  { value: "", label: "ไม่ระบุ" },
  { value: "salt", label: "ระบบเกลือ" },
  { value: "chlorine", label: "คลอรีน" },
] as const;


async function readApiResponse(response: Response) {
  const body = (await response
    .json()
    .catch(() => null)) as HouseFormResponse | null;

  if (!response.ok) {
    throw new Error(body?.error ?? "Request failed.");
  }

  return body ?? {};
}

async function readMutationResponse(response: Response) {
  const body = (await response
    .json()
    .catch(() => null)) as HouseImageMutationResponse | null;

  if (!response.ok) {
    throw new Error(body?.error ?? "Request failed.");
  }

  return body ?? {};
}

function getText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function getOptionalText(formData: FormData, name: string) {
  return getText(formData, name) || null;
}

function formatAreaLabel(area: AdminHouseCreateOptions["areas"][number]) {
  return [area.provinceName, area.zoneName, area.name].filter(Boolean).join(" / ");
}

function resolveAreaId(
  value: string,
  labelToId: Map<string, string>,
  idToLabel: Map<string, string>,
) {
  if (idToLabel.has(value)) return value;
  return labelToId.get(value) ?? "";
}

function filterAreaOptions(
  options: { id: string; label: string }[],
  query: string,
) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return options;
  return options.filter((option) => option.label.toLowerCase().includes(trimmed));
}

function getWeekdayPrices(formData: FormData) {
  return WEEKDAYS.flatMap((weekday) => {
    const price = getText(formData, `weekday_price_${weekday.value}`);
    const agencyPrice = getOptionalText(formData, `weekday_agency_price_${weekday.value}`);
    const note = getOptionalText(formData, `weekday_note_${weekday.value}`);

    return price
      ? [
        {
          weekday: weekday.value,
          price,
          agency_price: agencyPrice,
          note,
        },
      ]
      : [];
  });
}

function getWeekdayPrice(
  house: AdminHouseEditData | undefined,
  weekday: number,
) {
  return house?.weekdayPrices.find((price) => price.weekday === weekday);
}

function getTimeInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 5) : "";
}

function createDraftId() {
  return globalThis.crypto?.randomUUID?.() ?? String(Date.now());
}

function getInitialContacts(house: AdminHouseEditData | undefined) {
  return (
    house?.contacts.map((contact) => ({
      id: createDraftId(),
      name: contact.name ?? "",
      phoneNumber: contact.phoneNumber,
      role: contact.role ?? "",
      isPublic: contact.isPublic,
    })) ?? []
  );
}

function getInitialDatePrices(house: AdminHouseEditData | undefined) {
  return (
    house?.datePrices.map((datePrice) => ({
      id: createDraftId(),
      stayDate: datePrice.stayDate,
      priceType: datePrice.priceType,
      price: String(datePrice.price),
      agencyPrice: String(datePrice.agencyPrice ?? ""),
      note: datePrice.note ?? "",
      isActive: datePrice.isActive,
    })) ?? []
  );
}

async function deleteHouseImages(houseId: string, imageIds: string[]) {
  if (imageIds.length === 0) return;

  const response = await fetch(`/api/admin/houses/${houseId}/images`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: imageIds }),
  });

  await readMutationResponse(response);
}

async function uploadHouseImages(
  houseId: string,
  images: PendingHouseImageDraft[],
) {
  if (images.length === 0) return;

  const categoryGroups = images.reduce(
    (groups, image) => {
      const group = groups.get(image.category) ?? [];
      group.push(image);
      groups.set(image.category, group);
      return groups;
    },
    new Map<PendingHouseImageDraft["category"], PendingHouseImageDraft[]>(),
  );

  for (const [category, categoryImages] of categoryGroups.entries()) {
    const formData = new FormData();

    categoryImages.forEach((image) => {
      formData.append("files", image.file);
      formData.append("sort_orders", String(image.sortOrder));
    });

    formData.append("category", category);

    const response = await fetch(`/api/admin/houses/${houseId}/images`, {
      method: "POST",
      body: formData,
    });

    await readMutationResponse(response);
  }
}

export function HouseCreateForm({ house, options }: HouseCreateFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "pricing" | "images">("details");
  const [contacts, setContacts] = useState<ContactDraft[]>(() =>
    getInitialContacts(house),
  );
  const [datePrices, setDatePrices] = useState<DatePriceDraft[]>(() =>
    getInitialDatePrices(house),
  );
  const [pendingImages, setPendingImages] = useState<PendingHouseImageDraft[]>(
    [],
  );
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typeOptions, setTypeOptions] = useState(options.types);
  const [areaOptions, setAreaOptions] = useState(options.areas);
  const [facilityOptions, setFacilityOptions] = useState(options.facilities);
  const [selectedTypeId, setSelectedTypeId] = useState(house?.accommodationTypeId ?? "");
  const [selectedAreaId, setSelectedAreaId] = useState(house?.accommodationAreaId ?? "");
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>(house?.facilityIds ?? []);
  const [areaQuery, setAreaQuery] = useState(() => {
    const selected = options.areas.find((item) => item.id === house?.accommodationAreaId);
    return selected ? formatAreaLabel(selected) : "";
  });
  const [isAreaMenuOpen, setIsAreaMenuOpen] = useState(false);
  const [facilityNewName, setFacilityNewName] = useState("");
  const [facilityNewSlug, setFacilityNewSlug] = useState("");
  const [facilityNewIcon, setFacilityNewIcon] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaZoneId, setNewAreaZoneId] = useState("");
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [isAddAreaOpen, setIsAddAreaOpen] = useState(false);
  const [isAddFacilityOpen, setIsAddFacilityOpen] = useState(false);
  const blurTimeoutRef = useRef<number | null>(null);
  const canSubmit = areaOptions.length > 0 && typeOptions.length > 0 && Boolean(selectedAreaId) && Boolean(selectedTypeId);
  const isEditing = Boolean(house);
  const zoneOptions = useMemo(() => {
    const map = new Map<string, string>();
    areaOptions.forEach((area) => {
      if (area.accommodationZoneId && area.zoneName) {
        map.set(area.accommodationZoneId, [area.provinceName, area.zoneName].filter(Boolean).join(" / "));
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [areaOptions]);
  const areaAutocompleteOptions = useMemo(
    () => areaOptions.map((item) => ({ id: item.id, label: formatAreaLabel(item) })),
    [areaOptions],
  );
  const areaLabelById = useMemo(
    () => new Map(areaAutocompleteOptions.map((item) => [item.id, item.label])),
    [areaAutocompleteOptions],
  );
  const areaIdByLabel = useMemo(
    () => new Map(areaAutocompleteOptions.map((item) => [item.label, item.id])),
    [areaAutocompleteOptions],
  );

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  function addContact() {
    setContacts((current) => [
      ...current,
      {
        id: createDraftId(),
        name: "",
        phoneNumber: "",
        role: "",
        isPublic: false,
      },
    ]);
  }

  function updateContact(id: string, patch: Partial<Omit<ContactDraft, "id">>) {
    setContacts((current) =>
      current.map((contact) =>
        contact.id === id ? { ...contact, ...patch } : contact,
      ),
    );
  }

  function removeContact(id: string) {
    setContacts((current) => current.filter((contact) => contact.id !== id));
  }

  async function createSetting(payload: Record<string, unknown>) {
    const response = await fetch("/api/admin/houses/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await readApiResponse(response);
    return body.data?.id ?? "";
  }

  async function addNewType() {
    if (!newTypeName.trim()) return;
    try {
      const id = await createSetting({ kind: "type", name: newTypeName.trim() });
      if (!id) return;
      const next = { id, name: newTypeName.trim() };
      setTypeOptions((current) => [next, ...current]);
      setSelectedTypeId(id);
      setNewTypeName("");
      setIsAddTypeOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    }
  }

  async function addNewArea() {
    if (!newAreaName.trim() || !newAreaZoneId) return;
    try {
      const id = await createSetting({ kind: "area", name: newAreaName.trim(), accommodation_zone_id: newAreaZoneId });
      if (!id) return;
      const zone = zoneOptions.find((item) => item.id === newAreaZoneId);
      const parts = (zone?.label ?? "").split(" / ");
      const next = { id, name: newAreaName.trim(), accommodationZoneId: newAreaZoneId, provinceName: parts[0] ?? null, zoneName: parts[1] ?? null };
      setAreaOptions((current) => [next, ...current]);
      setSelectedAreaId(id);
      setAreaQuery([next.provinceName, next.zoneName, next.name].filter(Boolean).join(" / "));
      setNewAreaName("");
      setNewAreaZoneId("");
      setIsAddAreaOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    }
  }

  async function addNewFacility() {
    if (!facilityNewName.trim() || !facilityNewSlug.trim()) return;
    try {
      const id = await createSetting({ kind: "facility", name: facilityNewName.trim(), slug: facilityNewSlug.trim(), icon: facilityNewIcon.trim() || null });
      if (!id) return;
      const next = { id, name: facilityNewName.trim(), slug: facilityNewSlug.trim(), icon: facilityNewIcon.trim() || null };
      setFacilityOptions((current) => [next, ...current]);
      setSelectedFacilityIds((current) => [...current, id]);
      setFacilityNewName("");
      setFacilityNewSlug("");
      setFacilityNewIcon("");
      setIsAddFacilityOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) return;

    const formData = new FormData(event.currentTarget);
    setError(null);
    setFeedback(null);
    setIsPending(true);

    try {
      const response = await fetch(
        isEditing && house
          ? `/api/admin/houses/${house.id}`
          : "/api/admin/houses",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: getText(formData, "name"),
            code: getText(formData, "code"),
            status: getText(formData, "status"),
            accommodation_type_id: selectedTypeId,
            accommodation_area_id: selectedAreaId,
            normal_price: getText(formData, "normal_price"),
            normal_agency_price: getOptionalText(formData, "normal_agency_price"),
            extra_guest_price: getOptionalText(formData, "extra_guest_price"),
            security_deposit_amount: getOptionalText(
              formData,
              "security_deposit_amount",
            ),
            bedroom_count: getText(formData, "bedroom_count"),
            bathroom_count: getText(formData, "bathroom_count"),
            bedroom_details: getOptionalText(formData, "bedroom_details"),
            guest_capacity: getText(formData, "guest_capacity"),
            extra_guest_capacity: getOptionalText(
              formData,
              "extra_guest_capacity",
            ),
            address_details: getOptionalText(formData, "address_details"),
            google_maps_url: getOptionalText(formData, "google_maps_url"),
            distance_to_beach_meters: getOptionalText(
              formData,
              "distance_to_beach_meters",
            ),
            check_in_time: getOptionalText(formData, "check_in_time"),
            check_out_time: getOptionalText(formData, "check_out_time"),
            youtube_url: getOptionalText(formData, "youtube_url"),
            additional_details: getOptionalText(formData, "additional_details"),
            additional_fee_details: getOptionalText(
              formData,
              "additional_fee_details",
            ),
            weekday_prices: getWeekdayPrices(formData),
            pool_type: getText(formData, "pool_type") || "none",
            pool_system: getOptionalText(formData, "pool_system"),
            pool_description: getOptionalText(formData, "pool_description"),
            pets_allowed: getText(formData, "pets_allowed") === "true",
            pet_policy_details: getOptionalText(formData, "pet_policy_details"),
            facility_ids: selectedFacilityIds,
            contacts: contacts
              .map((contact) => ({
                name: contact.name.trim() || null,
                phone_number: contact.phoneNumber.trim(),
                role: contact.role.trim() || null,
                is_public: contact.isPublic,
              }))
              .filter((contact) => contact.phone_number),
            date_prices: datePrices
              .map((datePrice) => ({
                stay_date: datePrice.stayDate,
                price_type: datePrice.priceType,
                price: datePrice.price.trim(),
                agency_price: datePrice.agencyPrice.trim() || null,
                note: datePrice.note.trim() || null,
                is_active: datePrice.isActive,
              }))
              .filter((datePrice) => datePrice.stay_date && datePrice.price),
          }),
        },
      );
      const body = await readApiResponse(response);
      const id = body.data?.id;
      const savedHouseId = isEditing && house ? house.id : id;

      if (!savedHouseId) {
        throw new Error("House was saved but the id was not returned.");
      }

      await deleteHouseImages(savedHouseId, deletedImageIds);
      await uploadHouseImages(savedHouseId, pendingImages);

      if (isEditing) {
        pendingImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        setPendingImages([]);
        setDeletedImageIds([]);
        setFeedback("บันทึกแล้ว");
        setIsPending(false);
        router.refresh();
        return;
      }

      router.push(
        savedHouseId
          ? `/admin/houses?q=${encodeURIComponent(getText(formData, "code"))}`
          : "/admin/houses",
      );
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Request failed.");
      setIsPending(false);
    }
  }

  const tabs = [
    { id: "details", label: "รายละเอียดบ้าน" },
    { id: "pricing", label: "ราคา" },
    { id: "images", label: "รูปภาพ" },
  ] as const;

  return (
    <form onSubmit={submit} className="space-y-6">
      {!canSubmit ? (
        <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
          ต้องมีพื้นที่และประเภทที่พักก่อนสร้างบ้านพัก
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {feedback ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {feedback}
        </div>
      ) : null}

      <div className="flex flex-wrap border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-px px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={activeTab === "details" ? "space-y-6" : "hidden"}>
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground">
              ข้อมูลหลัก
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="ชื่อบ้าน" htmlFor="name">
                <Input id="name" name="name" defaultValue={house?.name} required />
              </Field>

              <Field label="รหัสบ้าน" htmlFor="code">
                <Input id="code" name="code" defaultValue={house?.code} required />
              </Field>

              {isEditing ? (
                <Field label="สถานะ" htmlFor="status">
                  <select
                    id="status"
                    name="status"
                    defaultValue={house?.status ?? "published"}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <input name="status" type="hidden" value="published" />
              )}

              <Field label="ประเภทที่พัก" htmlFor="accommodation_type_id">
                <div className="space-y-2">
                  <select
                    id="accommodation_type_id"
                    value={selectedTypeId}
                    onChange={(event) => setSelectedTypeId(event.target.value)}
                    required
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">เลือกประเภท</option>
                    {typeOptions.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  <Button type="button" variant="outline" onClick={() => setIsAddTypeOpen((current) => !current)}>
                    <Plus aria-hidden />
                    {isAddTypeOpen ? "ซ่อนเพิ่มประเภท" : "เพิ่มประเภทใหม่"}
                  </Button>
                  {isAddTypeOpen ? (
                    <div className="flex gap-2">
                      <Input value={newTypeName} onChange={(event) => setNewTypeName(event.target.value)} placeholder="เพิ่มประเภทใหม่" />
                      <Button type="button" variant="outline" onClick={addNewType}><Plus aria-hidden />Add</Button>
                    </div>
                  ) : null}
                </div>
              </Field>

              <Field label="พื้นที่" htmlFor="accommodation_area_search">
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="accommodation_area_search"
                      value={areaQuery}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setAreaQuery(nextValue);
                        const resolvedId = resolveAreaId(
                          nextValue,
                          areaIdByLabel,
                          areaLabelById,
                        );
                        setSelectedAreaId(resolvedId);
                        setIsAreaMenuOpen(true);
                      }}
                      onFocus={() => setIsAreaMenuOpen(true)}
                      onBlur={() => {
                        blurTimeoutRef.current = window.setTimeout(() => {
                          setIsAreaMenuOpen(false);
                        }, 120);
                      }}
                      placeholder={areaAutocompleteOptions.length > 0 ? "พิมพ์เพื่อค้นหา" : "ยังไม่มีพื้นที่"}
                    />
                    {isAreaMenuOpen ? (
                      <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-card shadow-sm">
                        {filterAreaOptions(areaAutocompleteOptions, areaQuery).map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-muted"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setAreaQuery(option.label);
                              setSelectedAreaId(option.id);
                              setIsAreaMenuOpen(false);
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                        {filterAreaOptions(areaAutocompleteOptions, areaQuery).length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            ไม่พบพื้นที่ที่ตรงกัน
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {!selectedAreaId && areaQuery ? (
                    <span className="text-xs text-destructive">กรุณาเลือกพื้นที่จากรายการ</span>
                  ) : null}
                  <Button type="button" variant="outline" onClick={() => setIsAddAreaOpen((current) => !current)}>
                    <Plus aria-hidden />
                    {isAddAreaOpen ? "ซ่อนเพิ่มพื้นที่" : "เพิ่มพื้นที่ใหม่"}
                  </Button>
                  {isAddAreaOpen ? (
                    <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                      <Input value={newAreaName} onChange={(event) => setNewAreaName(event.target.value)} placeholder="เพิ่มพื้นที่ใหม่" />
                      <select value={newAreaZoneId} onChange={(event) => setNewAreaZoneId(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">เลือกโซน</option>
                        {zoneOptions.map((zone) => (
                          <option key={zone.id} value={zone.id}>{zone.label}</option>
                        ))}
                      </select>
                      <Button type="button" variant="outline" onClick={addNewArea}><Plus aria-hidden />Add</Button>
                    </div>
                  ) : null}
                </div>
              </Field>

              <Field label="เวลาเช็กอิน" htmlFor="check_in_time">
                <Input
                  id="check_in_time"
                  name="check_in_time"
                  defaultValue={getTimeInputValue(house?.checkInTime)}
                  type="time"
                />
              </Field>

              <Field label="เวลาเช็กเอาต์" htmlFor="check_out_time">
                <Input
                  id="check_out_time"
                  name="check_out_time"
                  defaultValue={getTimeInputValue(house?.checkOutTime)}
                  type="time"
                />
              </Field>

              <Field label="YouTube URL" htmlFor="youtube_url">
                <Input
                  id="youtube_url"
                  name="youtube_url"
                  defaultValue={house?.youtubeUrl ?? ""}
                  type="url"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground">ราคาหลัก</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="ราคาหลัก" htmlFor="normal_price">
                <Input
                  id="normal_price"
                  name="normal_price"
                  defaultValue={house?.normalPrice ?? ""}
                  min="0"
                  required
                  step="1"
                  type="number"
                />
              </Field>

              <Field label="ราคา Agency (ปกติ)" htmlFor="normal_agency_price">
                <Input
                  id="normal_agency_price"
                  name="normal_agency_price"
                  defaultValue={house?.normalAgencyPrice ?? ""}
                  min="0"
                  placeholder="ราคาสำหรับ Agency"
                  step="1"
                  type="number"
                />
              </Field>

              <Field label="ราคาคนเสริม" htmlFor="extra_guest_price">
                <Input
                  id="extra_guest_price"
                  name="extra_guest_price"
                  defaultValue={house?.extraGuestPrice ?? ""}
                  min="0"
                  step="1"
                  type="number"
                />
              </Field>

              <Field label="เงินประกัน" htmlFor="security_deposit_amount">
                <Input
                  id="security_deposit_amount"
                  name="security_deposit_amount"
                  defaultValue={house?.securityDepositAmount ?? ""}
                  min="0"
                  step="1"
                  type="number"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground">สระ</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="ประเภทสระ" htmlFor="pool_type">
                <select
                  id="pool_type"
                  name="pool_type"
                  defaultValue={house?.poolType ?? "none"}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {POOL_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="ระบบสระ" htmlFor="pool_system">
                <select
                  id="pool_system"
                  name="pool_system"
                  defaultValue={house?.poolSystem ?? ""}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {POOL_SYSTEM_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-4">
              <Field label="รายละเอียดสระ" htmlFor="pool_description">
                <textarea
                  id="pool_description"
                  name="pool_description"
                  defaultValue={house?.poolDescription ?? ""}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground">
              สัตว์เลี้ยง
            </h2>

            <div className="mt-4 grid gap-4">
              <Field label="รับสัตว์เลี้ยง" htmlFor="pets_allowed">
                <select
                  id="pets_allowed"
                  name="pets_allowed"
                  defaultValue={house?.petsAllowed ? "true" : "false"}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="false">ไม่รับ</option>
                  <option value="true">รับ</option>
                </select>
              </Field>

              <Field label="รายละเอียดสัตว์เลี้ยง" htmlFor="pet_policy_details">
                <textarea
                  id="pet_policy_details"
                  name="pet_policy_details"
                  defaultValue={house?.petPolicyDetails ?? ""}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground">
              สิ่งอำนวยความสะดวก
            </h2>

            {facilityOptions.length > 0 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {facilityOptions.map((facility) => (
                  <label
                    key={facility.id}
                    className="flex min-h-10 items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFacilityIds.includes(facility.id)}
                      onChange={(event) =>
                        setSelectedFacilityIds((current) =>
                          event.target.checked
                            ? [...current, facility.id]
                            : current.filter((id) => id !== facility.id),
                        )
                      }
                      className="h-4 w-4 accent-brand"
                    />
                    <span>{facility.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                ยังไม่มีรายการ facilities
              </p>
            )}
            <div className="mt-4 space-y-2">
              <Button type="button" variant="outline" onClick={() => setIsAddFacilityOpen((current) => !current)}>
                <Plus aria-hidden />
                {isAddFacilityOpen ? "ซ่อนเพิ่มสิ่งอำนวยความสะดวก" : "เพิ่มสิ่งอำนวยความสะดวกใหม่"}
              </Button>
              {isAddFacilityOpen ? (
                <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
                  <Input placeholder="ชื่อสิ่งอำนวยความสะดวก" value={facilityNewName} onChange={(event) => setFacilityNewName(event.target.value)} />
                  <Input placeholder="slug" value={facilityNewSlug} onChange={(event) => setFacilityNewSlug(event.target.value)} />
                  <Input placeholder="icon" value={facilityNewIcon} onChange={(event) => setFacilityNewIcon(event.target.value)} />
                  <Button type="button" variant="outline" onClick={addNewFacility}>
                    <Plus aria-hidden />
                    Add
                  </Button>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-card-foreground">
                ติดต่อ
              </h2>
              <Button type="button" variant="outline" onClick={addContact}>
                <Plus aria-hidden />
                เพิ่มเบอร์
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="grid gap-3 border-t border-border pt-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]"
                >
                  <Input
                    value={contact.name}
                    onChange={(event) =>
                      updateContact(contact.id, { name: event.target.value })
                    }
                    placeholder="ชื่อ"
                  />
                  <Input
                    value={contact.phoneNumber}
                    onChange={(event) =>
                      updateContact(contact.id, {
                        phoneNumber: event.target.value,
                      })
                    }
                    placeholder="เบอร์โทร"
                  />
                  <Input
                    value={contact.role}
                    onChange={(event) =>
                      updateContact(contact.id, { role: event.target.value })
                    }
                    placeholder="role"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      checked={contact.isPublic}
                      onChange={(event) =>
                        updateContact(contact.id, {
                          isPublic: event.target.checked,
                        })
                      }
                      type="checkbox"
                      className="h-4 w-4 accent-brand"
                    />
                    public
                  </label>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="ลบเบอร์ติดต่อ"
                    onClick={() => removeContact(contact.id)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              ))}

              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ยังไม่มีเบอร์ติดต่อ
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground">ที่ตั้ง</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="ที่อยู่" htmlFor="address_details">
                <Input
                  id="address_details"
                  name="address_details"
                  defaultValue={house?.addressDetails ?? ""}
                />
              </Field>

              <Field label="ระยะห่างทะเล (เมตร)" htmlFor="distance_to_beach_meters">
                <Input
                  id="distance_to_beach_meters"
                  name="distance_to_beach_meters"
                  defaultValue={house?.distanceToBeachMeters ?? ""}
                  min="0"
                  step="1"
                  type="number"
                />
              </Field>

              <Field label="Google Maps URL" htmlFor="google_maps_url">
                <Input
                  id="google_maps_url"
                  name="google_maps_url"
                  defaultValue={house?.googleMapsUrl ?? ""}
                  type="url"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground">
              จำนวนคนและห้อง
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <Field label="ห้องนอน" htmlFor="bedroom_count">
                <Input
                  id="bedroom_count"
                  name="bedroom_count"
                  defaultValue={house?.bedroomCount ?? ""}
                  min="0"
                  required
                  step="1"
                  type="number"
                />
              </Field>

              <Field label="ห้องน้ำ" htmlFor="bathroom_count">
                <Input
                  id="bathroom_count"
                  name="bathroom_count"
                  defaultValue={house?.bathroomCount ?? ""}
                  min="0"
                  required
                  step="1"
                  type="number"
                />
              </Field>

              <Field label="จำนวนคนพัก" htmlFor="guest_capacity">
                <Input
                  id="guest_capacity"
                  name="guest_capacity"
                  defaultValue={house?.guestCapacity ?? ""}
                  min="1"
                  required
                  step="1"
                  type="number"
                />
              </Field>

              <Field label="คนเสริม" htmlFor="extra_guest_capacity">
                <Input
                  id="extra_guest_capacity"
                  name="extra_guest_capacity"
                  defaultValue={house?.extraGuestCapacity ?? ""}
                  min="0"
                  step="1"
                  type="number"
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="รายละเอียดห้องนอน" htmlFor="bedroom_details">
                <textarea
                  id="bedroom_details"
                  name="bedroom_details"
                  defaultValue={house?.bedroomDetails ?? ""}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground">
              รายละเอียดเพิ่มเติม
            </h2>

            <div className="mt-4 grid gap-4">
              <Field label="รายละเอียดบ้าน" htmlFor="additional_details">
                <textarea
                  id="additional_details"
                  name="additional_details"
                  defaultValue={house?.additionalDetails ?? ""}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </Field>

              <Field
                label="รายละเอียดค่าใช้จ่ายเพิ่มเติม"
                htmlFor="additional_fee_details"
              >
                <textarea
                  id="additional_fee_details"
                  name="additional_fee_details"
                  defaultValue={house?.additionalFeeDetails ?? ""}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </Field>
            </div>
          </section>

        </div>
      </div>

      <div className={activeTab === "pricing" ? "space-y-6" : "hidden"}>
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground">ราคา</h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-2">
              {WEEKDAYS.map((weekday) => {
                const weekdayPrice = getWeekdayPrice(house, weekday.value);

                return (
                  <div
                    key={weekday.value}
                    className="grid grid-cols-2 gap-3 rounded-md border border-border bg-background p-3"
                  >
                    <div className="col-span-2 flex items-center justify-between border-b pb-1 mb-1">
                      <Label className="font-bold">{weekday.label}</Label>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">ราคาปกติ</Label>
                      <Input
                        id={`weekday_price_${weekday.value}`}
                        name={`weekday_price_${weekday.value}`}
                        defaultValue={weekdayPrice?.price ?? ""}
                        min="0"
                        placeholder="ราคา"
                        step="1"
                        type="number"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">ราคา Agency</Label>
                      <Input
                        name={`weekday_agency_price_${weekday.value}`}
                        defaultValue={weekdayPrice?.agencyPrice ?? ""}
                        min="0"
                        placeholder="ราคา Agency"
                        step="1"
                        type="number"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        name={`weekday_note_${weekday.value}`}
                        defaultValue={weekdayPrice?.note ?? ""}
                        placeholder="หมายเหตุ"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {isEditing && (
            <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <AdminHouseCalendar
                datePrices={datePrices}
                setDatePrices={setDatePrices}
                createDraftId={createDraftId}
              />
            </section>
          )}
        </div>
      </div>

      <div className={activeTab === "images" ? "space-y-6" : "hidden"}>
        <AdminHouseImageManager
          existingImages={house?.images ?? []}
          pendingImages={pendingImages}
          deletedImageIds={deletedImageIds}
          createDraftId={createDraftId}
          setPendingImages={setPendingImages}
          setDeletedImageIds={setDeletedImageIds}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!canSubmit || isPending}>
          <Save aria-hidden />
          {isPending
            ? "กำลังบันทึก..."
            : isEditing
              ? "บันทึกการแก้ไข"
              : "สร้างบ้านพัก"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  children,
  htmlFor,
  label,
}: {
  children: ReactNode;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
