"use client";

import {
  BriefcaseBusiness,
  CircleHelp,
  FileCheck2,
  Files,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
  UsersRound,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import logo from '@/../public/assets/images/logo.png'
import LogoutModal from "@/components/modals/logout-modal";
import { useState } from "react";
import { toast } from "sonner";

const items = [
  {
    title: "Dashboard Overview",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Lead Management",
    url: "/lead-management",
    icon: UsersRound,
  },
    {
    title: "FAQ",
    url: "/faq",
    icon: CircleHelp,
  },
    {
    title: "Applied Job",
    url: "/applied-job",
    icon: FileCheck2,
  },
    {
    title: "Jobs",
    url: "/jobs",
    icon: BriefcaseBusiness,
  },
     {
    title: "Email Logs",
    url: "/email-automation",
    icon: Mail,
  },
    {
    title: "Knowledge Base",
    url: "/knowledge-base",
    icon: Files,
  },
];

export function DashboardSidebar() {
  const pathName = usePathname();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const handLogout = async () => {
    try {
      toast.success("Logout successful!");
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <div>
      <Sidebar className="w-[320px] border-none">
        <SidebarContent className="scrollbar-hide bg-gradient-to-b from-[#151C28] to-[#06080c]">
          <SidebarGroup className="p-0">
            <div className="flex min-h-screen flex-col justify-between pb-5">
              <div>
                <SidebarGroupLabel className="mt-5 mb-5 flex h-[80px] justify-center">
                  <Link href="/">
                    <Image
                      src={logo}
                      alt="logo"
                      width={1000}
                      height={1000}
                      className="h-[100px] w-[200px] object-cover"
                    />
                  </Link>
                </SidebarGroupLabel>

                <SidebarGroupContent className="px-4 pt-3">
                  <SidebarMenu>
                    {items.map((item) => {
                      const isActive =
                        item.url === "/"
                          ? pathName === "/"
                          : pathName === item.url ||
                            pathName.startsWith(`${item.url}/`);

                      return (
                        <SidebarMenuItem key={item.title} className="pb-2">
                          <SidebarMenuButton
                            asChild
                            className={`h-[48px] rounded-[8px] border border-white bg-transparent text-base font-medium leading-normal text-white transition-all duration-300 hover:bg-primary hover:text-white ${
                              isActive ? "bg-primary" : ""
                            }`}
                          >
                            <Link href={item.url}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </div>

              <SidebarFooter className="px-4">
                <Link
                  href="/settings"
                  className={`flex h-[48px] items-center gap-2 rounded-[8px] border border-white px-4 text-base font-medium leading-normal text-white transition-all duration-300 hover:bg-primary hover:text-white ${
                    pathName === "/settings" ||
                    pathName.startsWith("/settings/")
                      ? "bg-primary"
                      : "bg-transparent"
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>

                <button
                  onClick={() => setLogoutModalOpen(true)}
                  className="mt-2 flex h-[48px] w-full items-center gap-2 rounded-[8px] border border-white bg-[#FF0000] pl-4 text-base font-normal leading-normal text-white"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </SidebarFooter>
            </div>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {logoutModalOpen && (
        <LogoutModal
          isOpen={logoutModalOpen}
          onClose={() => setLogoutModalOpen(false)}
          onConfirm={handLogout}
        />
      )}
    </div>
  );
}
