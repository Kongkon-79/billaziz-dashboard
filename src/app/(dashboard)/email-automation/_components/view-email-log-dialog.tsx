"use client";

import { AlertCircle, CalendarClock, Mail, ReceiptText, Send } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { EmailLogItem } from "./email-automation-data-type";

type ViewEmailLogDialogProps = {
  log: EmailLogItem | null;
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

const getStatusStyles = (status: string) =>
  status === "sent"
    ? "bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]"
    : "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]";

const ViewEmailLogDialog = ({
  log,
  open,
  onOpenChange,
}: ViewEmailLogDialogProps) => {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[920px] overflow-y-auto rounded-[16px] border-none bg-white p-0">
        <DialogHeader className="border-b border-[#ECEEF2] px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold text-[#343A40]">
                {log.subject}
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm leading-6 text-[#68706A]">
                Delivery log details with recipient, status, and rendered HTML.
              </DialogDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={getStatusStyles(log.status)}>
                {log.status}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-[#68706A]">
                <CalendarClock className="h-4 w-4 text-primary" />
                {formatDate(log.createdAt)}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[14px] border border-[#ECEEF2] bg-[#F8FAFC] p-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-[#68706A]">To</p>
                  <p className="pt-1 text-base font-semibold text-[#343A40]">
                    {log.to}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-[14px] border border-[#ECEEF2] bg-[#F8FAFC] p-4">
              <div className="flex items-start gap-3">
                <Send className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-[#68706A]">
                    Template Key
                  </p>
                  <p className="pt-1 text-base font-semibold text-[#343A40]">
                    {log.templateKey || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            {log.orderId ? (
              <div className="rounded-[14px] border border-[#ECEEF2] bg-[#F8FAFC] p-4">
                <div className="flex items-start gap-3">
                  <ReceiptText className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-[#68706A]">Order ID</p>
                    <p className="pt-1 text-base font-semibold text-[#343A40]">
                      {log.orderId}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            {log.error ? (
              <div className="rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-1 h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-red-500">Error</p>
                    <p className="pt-1 text-base font-semibold text-[#343A40]">
                      {log.error}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {log.description ? (
            <div className="rounded-[14px] border border-[#ECEEF2] bg-white p-5">
              <h4 className="text-lg font-semibold text-[#343A40]">
                Description
              </h4>
              <p className="pt-3 text-sm leading-7 text-[#68706A]">
                {log.description}
              </p>
            </div>
          ) : null}

          <div className="rounded-[14px] border border-[#ECEEF2] bg-white p-5">
            <h4 className="text-lg font-semibold text-[#343A40]">
              Rendered HTML
            </h4>
            <div className="mt-4 overflow-hidden rounded-[12px] border border-[#ECEEF2]">
              <iframe
                title={`email-log-${log._id}`}
                srcDoc={log.htmlBody}
                className="h-[420px] w-full bg-white"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewEmailLogDialog;
