import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogOut } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export function LogoutButton() {
  async function logout() {
    "use server";

    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/");
  }

  return (
    <form action={logout}>
      <Button type="submit" size="sm" variant="outline">
        <LogOut className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">ออกจากระบบ</span>
      </Button>
    </form>
  );
}
