"use client";

import {
  CalendarClock,
  CircleAlert,
  Mail,
  MapPin,
  Phone,
  Building2,
  Package,
  BriefcaseBusiness,
  MessageSquareText,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { LeadItem } from "./lead-data-type";

type ViewLeadDialogProps = {
  lead: LeadItem | null;
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
    case "New":
      return "bg-primary/10 text-primary border-primary/20";
    case "Contacted":
      return "bg-[#FFF4DB] text-[#B7791F] border-[#F6D28B]";
    case "Qualified":
      return "bg-[#E6FFFA] text-[#0F766E] border-[#99F6E4]";
    case "Converted":
      return "bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]";
    case "Lost":
      return "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]";
    default:
      return "bg-[#F3F4F6] text-[#68706A] border-[#D9DEE5]";
  }
};

const getLeadSummaryRows = (lead: LeadItem) => [
  { label: "Email", value: lead.email, icon: Mail },
  { label: "Phone", value: lead.phone, icon: Phone },
  { label: "Company", value: lead.company, icon: Building2 },
  { label: "Source", value: lead.source, icon: BriefcaseBusiness },
  { label: "Pickup Address", value: lead.pickupAddress, icon: MapPin },
  { label: "Dropoff Address", value: lead.dropoffAddress, icon: MapPin },
  { label: "Item Type", value: lead.itemType, icon: Package },
  { label: "Urgency", value: lead.urgency, icon: CircleAlert },
  { label: "Service Needed", value: lead.serviceNeeded, icon: BriefcaseBusiness },
  { label: "Inquiry Type", value: lead.inquiryType, icon: MessageSquareText },
  { label: "Zip Code", value: lead.zipCode, icon: MapPin },
  { label: "Drop Zip Code", value: lead.dropZipCode, icon: MapPin },
]
  .filter((item) => item.value)
  .map((item) => ({ ...item, value: item.value as string }));

const ViewLeadDialog = ({
  lead,
  open,
  onOpenChange,
}: ViewLeadDialogProps) => {
  if (!lead) return null;

  const description = lead.formNotes || lead.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[860px] overflow-y-auto rounded-[16px] border-none bg-white p-0">
        <DialogHeader className="border-b border-[#ECEEF2] px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold text-[#343A40]">
                {lead.name}
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm leading-6 text-[#68706A]">
                Full lead details, submission context, and contact information.
              </DialogDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className={getStatusStyles(lead.status)}
              >
                {lead.status}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-[#68706A]">
                <CalendarClock className="h-4 w-4 text-primary" />
                {formatDate(lead.createdAt)}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            {getLeadSummaryRows(lead).map((item) => {
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

          {description ? (
            <div className="rounded-[14px] border border-[#ECEEF2] bg-white p-5">
              <h4 className="text-lg font-semibold text-[#343A40]">
                Lead Message
              </h4>
              <p className="pt-3 text-sm leading-7 text-[#68706A]">
                {description}
              </p>
            </div>
          ) : null}

          {lead.notes?.length ? (
            <div className="rounded-[14px] border border-[#ECEEF2] bg-white p-5">
              <h4 className="text-lg font-semibold text-[#343A40]">
                Internal Notes
              </h4>
              <div className="space-y-3 pt-4">
                {lead.notes.map((note, index) => (
                  <div
                    key={note._id ?? `${lead._id}-note-${index}`}
                    className="rounded-[12px] bg-[#F8FAFC] p-4"
                  >
                    <p className="text-sm leading-6 text-[#343A40]">
                      {note.note || "No note content provided."}
                    </p>
                    {note.createdAt ? (
                      <p className="pt-2 text-xs text-[#68706A]">
                        Added on {formatDate(note.createdAt)}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewLeadDialog;
