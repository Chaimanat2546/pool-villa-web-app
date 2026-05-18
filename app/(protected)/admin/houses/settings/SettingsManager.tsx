"use client";

import { Check, ChevronLeft, ChevronRight, Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import type { AdminHouseSettingsData } from "@/lib/houses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = { data: AdminHouseSettingsData };
type Kind = "province" | "zone" | "area" | "type" | "facility";
type EditDraft = { kind: Kind; id: string; name: string; provinceId?: string; accommodationZoneId?: string; slug?: string; icon?: string };
const PAGE_SIZE = 6;

function getText(fd: FormData, name: string) {
  const value = fd.get(name);
  return typeof value === "string" ? value.trim() : "";
}
async function readApiResponse(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) throw new Error(body?.error ?? "Request failed.");
}

export function SettingsManager({ data }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Kind>("province");
  const [pageByTab, setPageByTab] = useState<Record<Kind, number>>({ province: 1, zone: 1, area: 1, type: 1, facility: 1 });
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditDraft | null>(null);
  const [isAddProvinceOpen, setIsAddProvinceOpen] = useState(false);
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [zoneProvinceInput, setZoneProvinceInput] = useState("");
  const [zoneProvinceId, setZoneProvinceId] = useState("");
  const [isZoneMenuOpen, setIsZoneMenuOpen] = useState(false);
  const blurTimeoutRef = useRef<number | null>(null);

  const listByTab = { province: data.provinces, zone: data.zones, area: data.areas, type: data.types, facility: data.facilities } as const;
  const totalPages = Math.max(1, Math.ceil(listByTab[tab].length / PAGE_SIZE));
  const page = Math.min(pageByTab[tab], totalPages);
  const zoneNameById = useMemo(() => new Map(data.zones.map((z) => [z.id, [z.provinceName, z.name].filter(Boolean).join(" / ")])), [data.zones]);
  const provinceOptions = useMemo(() => data.provinces.map((p) => ({ id: p.id, label: p.name })), [data.provinces]);
  const provinceIdByLabel = useMemo(() => new Map(provinceOptions.map((p) => [p.label, p.id])), [provinceOptions]);

  function setPage(next: number) {
    setPageByTab((current) => ({ ...current, [tab]: Math.min(Math.max(1, next), totalPages) }));
  }
  async function createSetting(payload: Record<string, unknown>, msg: string, form?: HTMLFormElement) {
    if (pending) return;
    setPending(true); setError(null); setFeedback(null);
    try {
      const response = await fetch("/api/admin/houses/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      await readApiResponse(response);
      form?.reset();
      setFeedback(msg);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setPending(false);
    }
  }
  async function saveEdit() {
    if (!edit || pending) return;
    setPending(true); setError(null); setFeedback(null);
    try {
      const response = await fetch("/api/admin/houses/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: edit.id, kind: edit.kind, name: edit.name, province_id: edit.provinceId, accommodation_zone_id: edit.accommodationZoneId, slug: edit.slug, icon: edit.icon }),
      });
      await readApiResponse(response);
      setEdit(null);
      setFeedback("Saved changes.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      {error ? <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
      {feedback ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{feedback}</div> : null}

      <div className="flex flex-wrap gap-2 border-b border-border">
        {(["province", "zone", "area", "type", "facility"] as Kind[]).map((key) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={`-mb-px border-b-2 px-4 py-2 text-sm ${tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{key}</button>
        ))}
      </div>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        {tab === "province" ? (
          <div className="space-y-3">
            <Button type="button" variant="outline" onClick={() => setIsAddProvinceOpen((x) => !x)}><Plus aria-hidden />{isAddProvinceOpen ? "Hide add" : "Add province"}</Button>
            {isAddProvinceOpen ? (
              <form onSubmit={(e) => { e.preventDefault(); createSetting({ kind: "province", name: getText(new FormData(e.currentTarget), "name") }, "Added province.", e.currentTarget); setIsAddProvinceOpen(false); }} className="grid gap-3 md:grid-cols-[1fr_auto]">
                <Field label="Province" htmlFor="province-name"><Input id="province-name" name="name" required /></Field><SubmitButton disabled={pending} />
              </form>
            ) : null}
          </div>
        ) : null}
        {tab === "zone" ? (
          <div className="space-y-3">
            <Button type="button" variant="outline" onClick={() => setIsAddZoneOpen((x) => !x)}><Plus aria-hidden />{isAddZoneOpen ? "Hide add" : "Add zone"}</Button>
            {isAddZoneOpen ? (
              <form onSubmit={(e) => { e.preventDefault(); createSetting({ kind: "zone", province_id: zoneProvinceId, name: getText(new FormData(e.currentTarget), "name") }, "Added zone.", e.currentTarget); setZoneProvinceId(""); setZoneProvinceInput(""); setIsAddZoneOpen(false); }} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <Field label="Province" htmlFor="zone-province">
                  <div className="relative">
                    <Input id="zone-province" value={zoneProvinceInput} onChange={(e) => { const v = e.target.value; setZoneProvinceInput(v); setZoneProvinceId(provinceIdByLabel.get(v) ?? ""); setIsZoneMenuOpen(true); }} onFocus={() => setIsZoneMenuOpen(true)} onBlur={() => { blurTimeoutRef.current = window.setTimeout(() => setIsZoneMenuOpen(false), 120); }} placeholder="Type to search" />
                    {isZoneMenuOpen ? <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-card shadow-sm">{provinceOptions.filter((o) => o.label.toLowerCase().includes(zoneProvinceInput.toLowerCase())).map((o) => <button key={o.id} type="button" className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted" onMouseDown={(e) => e.preventDefault()} onClick={() => { setZoneProvinceInput(o.label); setZoneProvinceId(o.id); setIsZoneMenuOpen(false); }}>{o.label}</button>)}</div> : null}
                  </div>
                </Field>
                <Field label="Zone" htmlFor="zone-name"><Input id="zone-name" name="name" required /></Field><SubmitButton disabled={pending || !zoneProvinceId} />
              </form>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground"><tr>{tab === "province" ? <><th className="px-3 py-2 text-left">Province</th><th className="px-3 py-2 text-right">Manage</th></> : null}{tab === "zone" ? <><th className="px-3 py-2 text-left">Zone</th><th className="px-3 py-2 text-left">Province</th><th className="px-3 py-2 text-right">Manage</th></> : null}{tab === "area" ? <><th className="px-3 py-2 text-left">Area</th><th className="px-3 py-2 text-left">Zone</th><th className="px-3 py-2 text-right">Manage</th></> : null}{tab === "type" ? <><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-right">Manage</th></> : null}{tab === "facility" ? <><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">slug</th><th className="px-3 py-2 text-left">icon</th><th className="px-3 py-2 text-right">Manage</th></> : null}</tr></thead>
            <tbody>
              {tab === "province" ? data.provinces.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => { const editing = edit?.kind === "province" && edit.id === r.id; return <tr key={r.id} className="border-t border-border"><td className="px-3 py-2">{editing ? <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /> : r.name}</td><td className="px-3 py-2 text-right">{editing ? <EditActions pending={pending} onCancel={() => setEdit(null)} onSave={saveEdit} /> : <EditButton onClick={() => setEdit({ kind: "province", id: r.id, name: r.name })} />}</td></tr>; }) : null}
              {tab === "zone" ? data.zones.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => { const editing = edit?.kind === "zone" && edit.id === r.id; return <tr key={r.id} className="border-t border-border"><td className="px-3 py-2">{editing ? <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /> : r.name}</td><td className="px-3 py-2">{editing ? <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={edit.provinceId ?? ""} onChange={(e) => setEdit({ ...edit, provinceId: e.target.value })}><option value="">Select province</option>{data.provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select> : r.provinceName ?? "-"}</td><td className="px-3 py-2 text-right">{editing ? <EditActions pending={pending} onCancel={() => setEdit(null)} onSave={saveEdit} /> : <EditButton onClick={() => setEdit({ kind: "zone", id: r.id, name: r.name, provinceId: r.provinceId })} />}</td></tr>; }) : null}
              {tab === "area" ? data.areas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => { const editing = edit?.kind === "area" && edit.id === r.id; return <tr key={r.id} className="border-t border-border"><td className="px-3 py-2">{editing ? <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /> : r.name}</td><td className="px-3 py-2">{editing ? <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={edit.accommodationZoneId ?? ""} onChange={(e) => setEdit({ ...edit, accommodationZoneId: e.target.value })}><option value="">Select zone</option>{data.zones.map((z) => <option key={z.id} value={z.id}>{[z.provinceName, z.name].filter(Boolean).join(" / ")}</option>)}</select> : r.accommodationZoneId ? zoneNameById.get(r.accommodationZoneId) ?? "-" : "-"}</td><td className="px-3 py-2 text-right">{editing ? <EditActions pending={pending} onCancel={() => setEdit(null)} onSave={saveEdit} /> : <EditButton onClick={() => setEdit({ kind: "area", id: r.id, name: r.name, accommodationZoneId: r.accommodationZoneId ?? undefined })} />}</td></tr>; }) : null}
              {tab === "type" ? data.types.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => { const editing = edit?.kind === "type" && edit.id === r.id; return <tr key={r.id} className="border-t border-border"><td className="px-3 py-2">{editing ? <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /> : r.name}</td><td className="px-3 py-2 text-right">{editing ? <EditActions pending={pending} onCancel={() => setEdit(null)} onSave={saveEdit} /> : <EditButton onClick={() => setEdit({ kind: "type", id: r.id, name: r.name })} />}</td></tr>; }) : null}
              {tab === "facility" ? data.facilities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => { const editing = edit?.kind === "facility" && edit.id === r.id; return <tr key={r.id} className="border-t border-border"><td className="px-3 py-2">{editing ? <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /> : r.name}</td><td className="px-3 py-2">{editing ? <Input value={edit.slug ?? ""} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} /> : r.slug}</td><td className="px-3 py-2">{editing ? <Input value={edit.icon ?? ""} onChange={(e) => setEdit({ ...edit, icon: e.target.value })} /> : r.icon || "-"}</td><td className="px-3 py-2 text-right">{editing ? <EditActions pending={pending} onCancel={() => setEdit(null)} onSave={saveEdit} /> : <EditButton onClick={() => setEdit({ kind: "facility", id: r.id, name: r.name, slug: r.slug, icon: r.icon ?? "" })} />}</td></tr>; }) : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-sm text-muted-foreground"><span>Page {page} / {totalPages}</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft aria-hidden />Prev</Button><Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next<ChevronRight aria-hidden /></Button></div></div>
      </section>
    </div>
  );
}

function Field({ children, htmlFor, label }: { children: ReactNode; htmlFor: string; label: string }) {
  return <div className="grid gap-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}
function SubmitButton({ disabled }: { disabled: boolean }) {
  return <div className="flex items-end"><Button type="submit" disabled={disabled}><Plus aria-hidden />Add</Button></div>;
}
function EditButton({ onClick }: { onClick: () => void }) {
  return <Button type="button" variant="outline" size="sm" onClick={onClick}><Pencil aria-hidden />Edit</Button>;
}
function EditActions({ pending, onCancel, onSave }: { pending: boolean; onCancel: () => void; onSave: () => void }) {
  return <div className="inline-flex gap-2"><Button type="button" variant="outline" size="icon" onClick={onCancel}><X aria-hidden /></Button><Button type="button" size="icon" disabled={pending} onClick={onSave}><Check aria-hidden /></Button></div>;
}
