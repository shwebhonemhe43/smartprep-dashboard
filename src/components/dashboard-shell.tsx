import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode, ComponentType } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { BrandLogo } from "./brand-logo";
import { Button } from "@/components/ui/button";

export type NavItem = {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export function DashboardShell({
  items,
  groups,
  groupLabel,
  title,
  subtitle,
  children,
}: {
  items?: NavItem[];
  groups?: NavGroup[];
  groupLabel?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const isAdmin = currentPath.startsWith("/admin");
  const resolvedGroups: NavGroup[] =
    groups ?? (items ? [{ label: groupLabel ?? "", items }] : []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: isAdmin ? "/admin/login" : "/login", replace: true });
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
            <BrandLogo />
          </SidebarHeader>
          <SidebarContent>
            {resolvedGroups.map((group, idx) => (
              <SidebarGroup key={group.label || `group-${idx}`}>
                {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const active = currentPath === item.url;
                      return (
                        <SidebarMenuItem key={item.url}>
                          <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                            <Link to={item.url} className="flex items-center gap-2">
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Log out">
                  <Link to="/login" className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-lg font-semibold">{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to="/">View site</Link>
            </Button>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "primary",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  accent?: "primary" | "accent" | "chart-2" | "chart-3";
}) {
  const accentBg: Record<string, string> = {
    primary: "from-primary/10 to-primary-glow/20 text-primary",
    accent: "from-accent to-accent/40 text-accent-foreground",
    "chart-2": "from-chart-2/20 to-chart-2/5 text-chart-2",
    "chart-3": "from-chart-3/20 to-chart-3/5 text-chart-3",
  };
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${accentBg[accent]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PagePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center shadow-soft">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
