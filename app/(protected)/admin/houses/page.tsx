import Link from "next/link";
import { Suspense } from "react";
import { Pencil, Plus, Settings } from "lucide-react";
import {
  getAdminHouseSummaries,
  normalizeAdminHouseStatusFilter,
  type AdminHouseSummary,
} from "@/lib/houses";
import { requireRole } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminHousesPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
  }>;
};

const STATUS_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "published", label: "เผยแพร่" },
  { value: "archived", label: "ซ่อน" },
] as const;

export default function AdminHousesPage({
  searchParams,
}: AdminHousesPageProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Admin dashboard
          </p>
          <h1 className="text-3xl font-bold text-primary">บ้านพัก</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/houses/settings">
              <Settings aria-hidden />
              ตั้งค่า
            </Link>
          </Button>
        <Button asChild>
          <Link href="/admin/houses/new">
            <Plus aria-hidden />
            เพิ่มบ้านพัก
          </Link>
        </Button>
        </div>
      </div>

      <Suspense fallback={<p>Loading houses...</p>}>
        <AdminHouses searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminHouses({ searchParams }: AdminHousesPageProps) {
  await requireRole("admin");

  const params = await searchParams;
  const q = getFirstSearchParam(params.q);
  const status = normalizeAdminHouseStatusFilter(
    getFirstSearchParam(params.status),
  );
  const houses = await getAdminHouseSummaries({ q, status });

  return (
    <div className="space-y-4">
      <form
        action="/admin/houses"
        className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_180px_auto]"
      >
        <Input
          name="q"
          defaultValue={q}
          placeholder="ค้นหาชื่อบ้าน รหัส พื้นที่"
        />

        <select
          name="status"
          defaultValue={status}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <Button type="submit">ค้นหา</Button>
      </form>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          พบ {houses.length} รายการ
        </p>
      </div>

      {houses.length > 0 ? (
        <HouseTable houses={houses} />
      ) : (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          ยังไม่มีบ้านพักในเงื่อนไขนี้
        </div>
      )}
    </div>
  );
}

function HouseTable({ houses }: { houses: AdminHouseSummary[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
      <div className="grid grid-cols-[1fr_120px_100px] gap-4 border-b border-border bg-muted/40 px-4 py-3 text-sm font-medium text-muted-foreground">
        <span>บ้านพัก</span>
        <span>สถานะ</span>
        <span className="text-right">จัดการ</span>
      </div>

      <div className="divide-y divide-border">
        {houses.map((house) => (
          <div
            key={house.id}
            className="grid grid-cols-[1fr_120px_100px] gap-4 px-4 py-4"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-card-foreground">
                {house.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {house.code}
              </p>
              {house.accommodationTypeName ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {house.accommodationTypeName}
                </p>
              ) : null}
            </div>

            <div>
              <StatusBadge status={house.status} />
            </div>

            <div className="flex justify-end">
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/houses/${house.id}`}>
                  <Pencil aria-hidden />
                  แก้ไข
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: AdminHouseSummary["status"] }) {
  if (status === "published") {
    return <Badge>เผยแพร่</Badge>;
  }

  return <Badge variant="secondary">ซ่อน</Badge>;
}

function getFirstSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";

  return value ?? "";
}
