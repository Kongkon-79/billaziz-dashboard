"use client";

import {
  CalendarClock,
  FileText,
  FolderKanban,
  Layers3,
  ScanText,
  Tag,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { KnowledgeItem } from "./knowledge-base-data-type";

type ViewKnowledgeDialogProps = {
  document: KnowledgeItem | null;
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
  status === "active"
    ? "bg-primary/10 text-primary border-primary/20"
    : "bg-[#F3F4F6] text-[#68706A] border-[#D9DEE5]";

const ViewKnowledgeDialog = ({
  document,
  open,
  onOpenChange,
}: ViewKnowledgeDialogProps) => {
  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[920px] overflow-y-auto rounded-[16px] border-none bg-white p-0">
        <DialogHeader className="border-b border-[#ECEEF2] px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold text-[#343A40]">
                {document.title}
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm leading-6 text-[#68706A]">
                Full knowledge document details, extracted text, and chunk data.
              </DialogDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className={getStatusStyles(document.status)}
              >
                {document.status}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-[#68706A]">
                <CalendarClock className="h-4 w-4 text-primary" />
                {formatDate(document.createdAt)}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[14px] border border-[#ECEEF2] bg-[#F8FAFC] p-4">
              <div className="flex items-start gap-3">
                <FolderKanban className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-[#68706A]">Category</p>
                  <p className="pt-1 text-base font-semibold text-[#343A40]">
                    {document.category}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-[14px] border border-[#ECEEF2] bg-[#F8FAFC] p-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-[#68706A]">File</p>
                  <p className="pt-1 text-base font-semibold text-[#343A40]">
                    {document.originalFileName || "Manual content only"}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-[14px] border border-[#ECEEF2] bg-[#F8FAFC] p-4">
              <div className="flex items-start gap-3">
                <Layers3 className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-[#68706A]">Chunks</p>
                  <p className="pt-1 text-base font-semibold text-[#343A40]">
                    {document.chunkCount}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-[14px] border border-[#ECEEF2] bg-[#F8FAFC] p-4">
              <div className="flex items-start gap-3">
                <ScanText className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-[#68706A]">
                    Text Extracted
                  </p>
                  <p className="pt-1 text-base font-semibold text-[#343A40]">
                    {document.isTextExtracted ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {document.tags?.length ? (
            <div className="rounded-[14px] border border-[#ECEEF2] bg-white p-5">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <h4 className="text-lg font-semibold text-[#343A40]">Tags</h4>
              </div>
              <div className="flex flex-wrap gap-2 pt-3">
                {document.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-primary/20 bg-primary/5 px-3 py-1 text-xs text-[#343A40]"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-[14px] border border-[#ECEEF2] bg-white p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-semibold text-[#343A40]">
                Full Content
              </h4>
            </div>
            <pre className="whitespace-pre-wrap break-words pt-3 text-sm leading-7 text-[#68706A]">
              {document.content || "No content available."}
            </pre>
          </div>

          {document.chunks?.length ? (
            <div className="rounded-[14px] border border-[#ECEEF2] bg-white p-5">
              <div className="flex items-center gap-2">
                <Layers3 className="h-5 w-5 text-primary" />
                <h4 className="text-lg font-semibold text-[#343A40]">
                  Chunks
                </h4>
              </div>
              <div className="space-y-3 pt-4">
                {document.chunks.map((chunk, index) => (
                  <div
                    key={`${document._id}-chunk-${index}`}
                    className="rounded-[12px] bg-[#F8FAFC] p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Chunk {index + 1}
                    </p>
                    <p className="pt-2 text-sm leading-6 text-[#343A40]">
                      {chunk}
                    </p>
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

export default ViewKnowledgeDialog;
