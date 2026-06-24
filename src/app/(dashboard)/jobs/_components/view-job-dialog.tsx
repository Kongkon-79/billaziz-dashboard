"use client";

import {
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CircleDollarSign,
  Layers3,
  ListChecks,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRoundSearch,
  Users,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { JobItem } from "./jobs-data-type";

type ViewJobDialogProps = {
  job: JobItem | null;
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
    case "Active":
      return "bg-primary/10 text-primary border-primary/20";
    case "Closed":
      return "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]";
    default:
      return "bg-[#F3F4F6] text-[#68706A] border-[#D9DEE5]";
  }
};

const getSummaryItems = (job: JobItem) => [
  { label: "Category", value: job.category, icon: BriefcaseBusiness },
  { label: "Location", value: job.location, icon: MapPin },
  { label: "Company", value: job.companyName, icon: Building2 },
  { label: "Experience", value: job.experienceLevel, icon: UserRoundSearch },
  { label: "Salary Range", value: job.salaryRange, icon: CircleDollarSign },
  {
    label: "Vacancy",
    value:
      typeof job.vacancy === "number"
        ? `${job.vacancy} ${job.vacancy > 1 ? "Vacancies" : "Vacancy"}`
        : undefined,
    icon: Users,
  },
  {
    label: "Deadline",
    value: job.applicationDeadline
      ? formatDate(job.applicationDeadline)
      : undefined,
    icon: CalendarClock,
  },
]
  .filter((item) => item.value)
  .map((item) => ({ ...item, value: item.value as string }));

const renderList = (items?: string[]) => {
  if (!items?.length) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-3">
      {items.map((item) => (
        <Badge
          key={item}
          variant="outline"
          className="border-primary/20 bg-primary/5 px-3 py-1 text-xs text-[#343A40]"
        >
          {item}
        </Badge>
      ))}
    </div>
  );
};

const ViewJobDialog = ({ job, open, onOpenChange }: ViewJobDialogProps) => {
  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[900px] overflow-y-auto rounded-[16px] border-none bg-white p-0">
        <DialogHeader className="border-b border-[#ECEEF2] px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold text-[#343A40]">
                {job.title}
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm leading-6 text-[#68706A]">
                Full job information, hiring requirements, and role metadata.
              </DialogDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={getStatusStyles(job.status)}>
                {job.status}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-[#68706A]">
                <CalendarClock className="h-4 w-4 text-primary" />
                {formatDate(job.createdAt)}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            {getSummaryItems(job).map((item) => {
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
              <Layers3 className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-semibold text-[#343A40]">
                Job Description
              </h4>
            </div>
            <p className="pt-3 text-sm leading-7 text-[#68706A]">
              {job.description}
            </p>
          </div>

          {job.responsibilities ? (
            <div className="rounded-[14px] border border-[#ECEEF2] bg-white p-5">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                <h4 className="text-lg font-semibold text-[#343A40]">
                  Responsibilities
                </h4>
              </div>
              <p className="pt-3 text-sm leading-7 text-[#68706A]">
                {job.responsibilities}
              </p>
            </div>
          ) : null}

          {job.qualifications ? (
            <div className="rounded-[14px] border border-[#ECEEF2] bg-white p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h4 className="text-lg font-semibold text-[#343A40]">
                  Qualifications
                </h4>
              </div>
              <p className="pt-3 text-sm leading-7 text-[#68706A]">
                {job.qualifications}
              </p>
            </div>
          ) : null}

          {job.requiredSkills?.length ? (
            <div className="rounded-[14px] border border-[#ECEEF2] bg-white p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h4 className="text-lg font-semibold text-[#343A40]">
                  Required Skills
                </h4>
              </div>
              {renderList(job.requiredSkills)}
            </div>
          ) : null}

          {job.benefits?.length ? (
            <div className="rounded-[14px] border border-[#ECEEF2] bg-white p-5">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h4 className="text-lg font-semibold text-[#343A40]">
                  Benefits
                </h4>
              </div>
              {renderList(job.benefits)}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewJobDialog;
