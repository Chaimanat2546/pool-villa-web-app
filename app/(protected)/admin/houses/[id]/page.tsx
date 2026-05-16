import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import {
  getAdminHouseCreateOptions,
  getAdminHouseForEdit,
} from "@/lib/houses";
import { Button } from "@/components/ui/button";
import { HouseCreateForm } from "../new/HouseCreateForm";

type AdminEditHousePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function AdminEditHousePage({
  params,
}: AdminEditHousePageProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Suspense fallback={<p>Loading house...</p>}>
        <EditHouse params={params} />
      </Suspense>
    </div>
  );
}

async function EditHouse({ params }: AdminEditHousePageProps) {
  await requireRole("admin");

  const { id } = await params;
  const [house, options] = await Promise.all([
    getAdminHouseForEdit(id),
    getAdminHouseCreateOptions(),
  ]);

  if (!house) {
    notFound();
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Admin dashboard
          </p>
          <h1 className="text-3xl font-bold text-primary">{house.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{house.code}</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/admin/houses">
            <ArrowLeft aria-hidden />
            กลับรายการบ้าน
          </Link>
        </Button>
      </div>

      <HouseCreateForm house={house} options={options} />
    </>
  );
}
