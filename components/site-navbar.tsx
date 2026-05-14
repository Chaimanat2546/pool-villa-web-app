import Link from "next/link";
import type { ComponentType } from "react";
import {
  BookOpenText,
  Home,
  LayoutDashboard,
  LogIn,
  Search,
  UserRound,
  UserPlus,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import Image from "next/image";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const PUBLIC_NAV_ITEMS: NavItem[] = [
  { href: "/houses", label: "บ้านพัก", icon: Home },
  // { href: "/houses/search", label: "ค้นหา", icon: Search },
  { href: "/blog", label: "บทความ", icon: BookOpenText },
];

const USER_NAV_ITEMS: NavItem[] = [
  { href: "/user", label: "หน้าของฉัน", icon: UserRound },
  ...PUBLIC_NAV_ITEMS,
];

function getNavigationItems(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (user?.role === "user") return USER_NAV_ITEMS;

  return PUBLIC_NAV_ITEMS;
}

export async function SiteNavbar() {
  const user = await getCurrentUser();
  const navigationItems = getNavigationItems(user);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <nav className="relative mx-auto flex h-16 w-full items-center px-4 sm:px-6">
        <Link
          href="/houses"
          className="flex shrink-0 items-center gap-2 font-semibold text-brand"
        >
          <Image
            src="https://d24r25u6qcb3zryipzoiqj2jxy0ilqtm.lambda-url.ap-southeast-1.on.aws/deville/64c38eb68e1a0_47b2af21450c781b.png?w=384&q=90"
            alt="Pool Villa Pattaya"
            width={40}
            height={40}
            className="h-10 w-auto"
          />

          <span className="hidden sm:inline">Pool Villa Pattaya</span>
        </Link>

        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-brand hover:text-brand-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="absolute right-4 flex shrink-0 items-center gap-2 sm:right-6">
          <Button asChild size="sm" variant="ghost" className=" hover:bg-brand hover:text-brand-foreground">
            <Link href="/houses/search">
              <Search className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          {user ? (
            <>
              <Button asChild size="sm" variant="outline" className=" hover:bg-brand hover:text-brand-foreground">
                <Link href={user.role === "admin" ? "/admin" : "/user"}>
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>
              <LogoutButton />
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className=" hover:bg-brand/90 bg-brand text-brand-foreground">
                <Link href="/auth/login">
                  <LogIn className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">เข้าสู่ระบบ</span>
                </Link>
              </Button>
              <Button asChild size="sm" className=" bg-inherit text-inherit hover:bg-brand/10">
                <Link href="/auth/sign-up">
                  <UserPlus className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">สมัครสมาชิก</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header >
  );
}
