"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LeafIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { navItems, type NavItem } from "@/config/nav";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";


export function MainSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <LeafIcon className="h-7 w-7 text-primary" />
          <h2 className="text-lg font-semibold text-foreground group-data-[collapsible=icon]:hidden">
            FaceAttend Pro
          </h2>
        </Link>
      </SidebarHeader>
      <Separator className="my-0" />
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{ children: item.title, side: "right" }}
                  className="justify-start"
                >
                  <a>
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 mt-auto border-t">
         <div className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            © {new Date().getFullYear()} FaceAttend Pro
          </div>
      </SidebarFooter>
    </Sidebar>
  );
}
