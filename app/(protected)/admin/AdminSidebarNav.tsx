"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  BookOpenText,
  ExternalLink,
  House,
  LayoutDashboard,
  PencilLine,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

type AdminSidebarItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const ADMIN_SIDEBAR_ITEMS: AdminSidebarItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/houses", label: "บ้านพัก", icon: House },
  { href: "/admin/recommendations", label: "บ้านแนะนำ", icon: Sparkles },
  { href: "/admin/blog", label: "บทความ", icon: BookOpenText },
  { href: "/admin/blog/new", label: "เขียนบทความ", icon: PencilLine },
  { href: "/houses", label: "ดูหน้าเว็บ", icon: ExternalLink },
];

function isActiveAdminItem(href: string, pathname: string) {
  if (href === "/admin") return pathname === href;
  if (href === "/admin/blog") {
    return (
      pathname === href ||
      (pathname.startsWith("/admin/blog/") && pathname !== "/admin/blog/new")
    );
  }
  if (href === "/admin/blog/new") return pathname === href;
  if (href === "/houses") return false;

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin navigation"
      className="mt-3 flex gap-2 overflow-x-auto border-t border-border pt-3 lg:flex-col lg:overflow-visible"
    >
      {ADMIN_SIDEBAR_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = isActiveAdminItem(item.href, pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "hover:bg-brand hover:text-brand-foreground",
              isActive && "bg-brand text-brand-foreground shadow-sm",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
