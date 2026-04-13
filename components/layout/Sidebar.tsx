"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Bot,
  Workflow,
  LayoutDashboard,
  History,
  LogOut,
  Zap,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/runs", label: "Run History", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-14 flex flex-col h-screen sticky top-0 border-r border-white/[0.06] bg-black/20 backdrop-blur-xl">
      {/* Logo */}
      <div className="h-14 flex items-center justify-center border-b border-white/[0.06]">
        <Tooltip>
          {/* base-ui: use render prop instead of asChild */}
          <TooltipTrigger render={<Link href="/" className="flex items-center justify-center" />}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-md shadow-violet-500/20 transition-transform duration-200 hover:scale-105">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="glass border-white/10 text-white/80">
            Gumloop
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center py-3 gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Tooltip key={href}>
              <TooltipTrigger
                render={
                  <Link
                    href={href}
                    className={cn(
                      "relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200",
                      active
                        ? "bg-violet-500/20 text-violet-300"
                        : "text-white/30 hover:text-white/70 hover:bg-white/5"
                    )}
                  />
                }
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[1px] w-0.5 h-5 bg-violet-400 rounded-r-full" />
                )}
                <Icon className="w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent side="right" className="glass border-white/10 text-white/80">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Logout — TooltipTrigger already renders a <button>, just pass props directly */}
      <div className="pb-3 flex justify-center border-t border-white/[0.06] pt-3">
        <Tooltip>
          <TooltipTrigger
            onClick={handleLogout}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
          </TooltipTrigger>
          <TooltipContent side="right" className="glass border-white/10 text-white/80">
            Sign out
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
