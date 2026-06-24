"use client";

import {
  BriefcaseBusiness,
  CalendarClock,
  CircleAlert,
  Mail,
  MessageSquareText,
  Phone,
  UserRound,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { AppliedJobItem } from "./applied-job-data-type";

type ViewAppliedJobDialogProps = {
  application: AppliedJobItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const getStatusStyles = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-[#FFF4DB] text-[#B7791F] border-[#F6D28B]";
    case "Reviewed":
      return "bg-primary/10 text-primary border-primary/20";
    case "Selected":
      return "bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]";
    case "Rejected":
      return "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]";
    default:
      return "bg-[#F3F4F6] text-[#68706A] border-[#D9DEE5]";
  }
};

const ViewAppliedJobDialog = ({
  application,
  open,
  onOpenChange,
}: ViewAppliedJobDialogProps) => {
  if (!application) return null;

  const summaryItems = [
    { label: "Email", value: application.email, icon: Mail },
    { label: "Phone", value: application.phone, icon: Phone },
    {
      label: "Interested Position",
      value: application.interestedPosition,
      icon: BriefcaseBusiness,
    },
    {
      label: "Job Reference",
      value: application.jobId,
      icon: CircleAlert,
    },
  ].filter((item) => item.value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[860px] overflow-y-auto rounded-[16px] border-none bg-white p-0">
        <DialogHeader className="border-b border-[#ECEEF2] px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold text-[#343A40]">
                {application.name}
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm leading-6 text-[#68706A]">
                Candidate profile, selected role, and submission details.
              </DialogDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className={getStatusStyles(application.status)}
              >
                {application.status}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-[#68706A]">
                <CalendarClock className="h-4 w-4 text-primary" />
                {formatDate(application.createdAt)}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[14px] border border-[#ECEEF2] bg-[#F8FAFC] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#68706A]">Name</p>
                  <p className="pt-1 text-base font-semibold leading-6 text-[#343A40]">
                    {application.name}
                  </p>
                </div>
              </div>
            </div>

            {summaryItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-[14px] border border-[#ECEEF2] bg-[#F8FAFC] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#68706A]">
                        {item.label}
                      </p>
                      <p className="pt-1 text-base font-semibold leading-6 text-[#343A40]">
                        {item.value}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-[14px] border border-[#ECEEF2] bg-white p-5">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-semibold text-[#343A40]">
                Candidate Summary
              </h4>
            </div>
            <p className="pt-3 text-sm leading-7 text-[#68706A]">
              {application.tellUsYourself}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewAppliedJobDialog;
