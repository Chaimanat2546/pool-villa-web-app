"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import type { AdminHouseSettingsData } from "@/lib/houses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SettingsManagerProps = {
  data: AdminHouseSettingsData;
};

type SettingsResponse = {
  error?: string;
};

async function readApiResponse(response: Response) {
  const body = (await response.json().catch(() => null)) as
    | SettingsResponse
    | null;

  if (!response.ok) {
    throw new Error(body?.error ?? "Request failed.");
  }
}

function getText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

export function SettingsManager({ data }: SettingsManagerProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(
    event: FormEvent<HTMLFormElement>,
    payload: (formData: FormData) => Record<string, unknown>,
    successMessage: string,
  ) {
    event.preventDefault();

    if (isPending) return;

    setIsPending(true);
    setFeedback(null);
    setError(null);

    try {
      const form = event.currentTarget;
      const response = await fetch("/api/admin/houses/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(new FormData(form))),
      });

      await readApiResponse(response);
      form.reset();
      setFeedback(successMessage);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
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

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsSection title="จังหวัด" items={data.provinces.map((item) => item.name)}>
          <form
            onSubmit={(event) =>
              submit(
                event,
                (formData) => ({
                  kind: "province",
                  name: getText(formData, "name"),
                }),
                "เพิ่มจังหวัดแล้ว",
              )
            }
            className="grid gap-3 md:grid-cols-[1fr_auto]"
          >
            <Field label="ชื่อจังหวัด" htmlFor="province-name">
              <Input id="province-name" name="name" required />
            </Field>
            <SubmitButton disabled={isPending} />
          </form>
        </SettingsSection>

        <SettingsSection
          title="โซน"
          items={data.zones.map((item) =>
            [item.provinceName, item.name].filter(Boolean).join(" / "),
          )}
        >
          <form
            onSubmit={(event) =>
              submit(
                event,
                (formData) => ({
                  kind: "zone",
                  province_id: getText(formData, "province_id"),
                  name: getText(formData, "name"),
                }),
                "เพิ่มโซนแล้ว",
              )
            }
            className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
          >
            <Field label="จังหวัด" htmlFor="zone-province">
              <select
                id="zone-province"
                name="province_id"
                required
                disabled={data.provinces.length === 0}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">เลือกจังหวัด</option>
                {data.provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="ชื่อโซน" htmlFor="zone-name">
              <Input id="zone-name" name="name" required />
            </Field>
            <SubmitButton
              disabled={isPending || data.provinces.length === 0}
            />
          </form>
        </SettingsSection>

        <SettingsSection
          title="พื้นที่"
          items={data.areas.map((item) =>
            [item.provinceName, item.zoneName, item.name]
              .filter(Boolean)
              .join(" / "),
          )}
        >
          <form
            onSubmit={(event) =>
              submit(
                event,
                (formData) => ({
                  kind: "area",
                  accommodation_zone_id: getText(
                    formData,
                    "accommodation_zone_id",
                  ),
                  name: getText(formData, "name"),
                }),
                "เพิ่มพื้นที่แล้ว",
              )
            }
            className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
          >
            <Field label="โซน" htmlFor="area-zone">
              <select
                id="area-zone"
                name="accommodation_zone_id"
                required
                disabled={data.zones.length === 0}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">เลือกโซน</option>
                {data.zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {[zone.provinceName, zone.name].filter(Boolean).join(" / ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="ชื่อพื้นที่" htmlFor="area-name">
              <Input id="area-name" name="name" required />
            </Field>
            <SubmitButton disabled={isPending || data.zones.length === 0} />
          </form>
        </SettingsSection>

        <SettingsSection title="ประเภทที่พัก" items={data.types.map((item) => item.name)}>
          <form
            onSubmit={(event) =>
              submit(
                event,
                (formData) => ({
                  kind: "type",
                  name: getText(formData, "name"),
                }),
                "เพิ่มประเภทแล้ว",
              )
            }
            className="grid gap-3 md:grid-cols-[1fr_auto]"
          >
            <Field label="ชื่อประเภท" htmlFor="type-name">
              <Input id="type-name" name="name" required />
            </Field>
            <SubmitButton disabled={isPending} />
          </form>
        </SettingsSection>

        <SettingsSection
          title="สิ่งอำนวยความสะดวก"
          items={data.facilities.map((item) => `${item.name} (${item.slug})`)}
        >
          <form
            onSubmit={(event) =>
              submit(
                event,
                (formData) => ({
                  kind: "facility",
                  name: getText(formData, "name"),
                  slug: getText(formData, "slug"),
                  icon: getText(formData, "icon"),
                }),
                "เพิ่มสิ่งอำนวยความสะดวกแล้ว",
              )
            }
            className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <Field label="ชื่อ" htmlFor="facility-name">
              <Input id="facility-name" name="name" required />
            </Field>
            <Field label="slug" htmlFor="facility-slug">
              <Input id="facility-slug" name="slug" required />
            </Field>
            <Field label="icon" htmlFor="facility-icon">
              <Input id="facility-icon" name="icon" />
            </Field>
            <SubmitButton disabled={isPending} />
          </form>
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({
  children,
  items,
  title,
}: {
  children: ReactNode;
  items: string[];
  title: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
      <div className="mt-4 border-t border-border pt-4">
        {items.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <span
                key={item}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
        )}
      </div>
    </section>
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

function SubmitButton({ disabled }: { disabled: boolean }) {
  return (
    <div className="flex items-end">
      <Button type="submit" disabled={disabled}>
        <Plus aria-hidden />
        เพิ่ม
      </Button>
    </div>
  );
}
