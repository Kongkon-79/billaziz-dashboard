"use client";

import { KeyRound, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import DashboardOverviewHeader from "../_components/dashboard-overview-header";

const settingsLinks = [
  {
    href: "/settings/personal-information",
    label: "Personal Information",
    description: "Manage your profile details",
    icon: UserRound,
  },
  {
    href: "/settings/change-password",
    label: "Change Password",
    description: "Update your account password",
    icon: KeyRound,
  },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <DashboardOverviewHeader
        title="Settings"
        description="Manage your account preferences and system settings in one place."
      />

      <div className="space-y-6 p-4 md:p-6">
        <div className="grid gap-3 rounded-[12px] border border-[#E6E7E6] bg-white p-3 shadow-[0px_4px_12px_0px_#0000000D] md:grid-cols-2">
          {settingsLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex min-h-[76px] items-center gap-4 rounded-[10px] border px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? "border-primary bg-primary text-white shadow-[0px_6px_16px_0px_#F9670630]"
                    : "border-[#E0E4EC] bg-[#F8F9FA] text-[#343A40] hover:border-primary/50 hover:bg-[#FFF7F2]"
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-white text-primary shadow-sm"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-base font-semibold">
                    {item.label}
                  </span>
                  <span
                    className={`mt-0.5 block text-sm ${
                      isActive ? "text-white/80" : "text-[#68706A]"
                    }`}
                  >
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </div>
  );
}
