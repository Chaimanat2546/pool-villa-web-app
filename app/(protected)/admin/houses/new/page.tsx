import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getAdminHouseCreateOptions } from "@/lib/houses";
import { Button } from "@/components/ui/button";
import { HouseCreateForm } from "./HouseCreateForm";

export default function AdminNewHousePage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Admin dashboard
          </p>
          <h1 className="text-3xl font-bold text-primary">เพิ่มบ้านพัก</h1>
        </div>

        <Button asChild variant="outline">
          <Link href="/admin/houses">
            <ArrowLeft aria-hidden />
            กลับรายการบ้าน
          </Link>
        </Button>
      </div>

      <Suspense fallback={<p>Loading house form...</p>}>
        <NewHouseForm />
      </Suspense>
    </div>
  );
}

async function NewHouseForm() {
  await requireRole("admin");
  const options = await getAdminHouseCreateOptions();

  return <HouseCreateForm options={options} />;
}
