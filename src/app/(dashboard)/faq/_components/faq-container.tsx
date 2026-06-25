"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarClock,
  Loader2,
  PenSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import DeleteModal from "@/components/modals/delete-modal";
import ErrorContainer from "@/components/shared/ErrorContainer/ErrorContainer";
import CustomPagination from "@/components/shared/pagination/custom-pagination";
import TableSkeletonWrapper from "@/components/shared/TableSkeletonWrapper/TableSkeletonWrapper";
import type {
  FaqFormValues,
  FaqItem,
  FaqListResponse,
  FaqMutationResponse,
  FaqStatus,
} from "./faq-data-type";

const faqSchema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters long."),
  answer: z.string().min(10, "Answer must be at least 10 characters long."),
  status: z.enum(["active", "inactive"]),
});

const defaultValues: FaqFormValues = {
  question: "",
  answer: "",
  status: "active",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const getStatusStyles = (status: FaqStatus) =>
  status === "active"
    ? "bg-primary/10 text-primary border-primary/20"
    : "bg-[#F3F4F6] text-[#68706A] border-[#D9DEE5]";

const FaqContainer = () => {
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;

  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FaqItem | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<FaqItem | null>(null);

  const form = useForm<FaqFormValues>({
    resolver: zodResolver(faqSchema),
    defaultValues,
  });

  const { data, isLoading, isError, error, isFetching } =
    useQuery<FaqListResponse>({
      queryKey: ["faqs", page],
      queryFn: async () => {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/faqs?sortBy=createdAt&limit=10&page=${page}`
        );

        const response = await res.json();

        if (!res.ok || !response?.success) {
          throw new Error(response?.message || "Failed to fetch FAQs");
        }

        return response;
      },
      enabled: !!token,
    });

  const createFaqMutation = useMutation({
    mutationFn: async (values: FaqFormValues) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/faqs`, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const response: FaqMutationResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to create FAQ");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "FAQ created successfully");
      setIsFormOpen(false);
      form.reset(defaultValues);
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to create FAQ"
      );
    },
  });

  const updateFaqMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: FaqFormValues;
    }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/faqs/${id}`,
        {
          method: "PUT",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(values),
        }
      );

      const response: FaqMutationResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to update FAQ");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "FAQ updated successfully");
      setIsFormOpen(false);
      setSelectedFaq(null);
      form.reset(defaultValues);
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to update FAQ"
      );
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/faqs/${id}`,
        {
          method: "DELETE",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response: FaqMutationResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to delete FAQ");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "FAQ deleted successfully");
      setFaqToDelete(null);

      const totalItemsAfterDelete = (data?.meta.total || 1) - 1;
      const totalPagesAfterDelete = Math.max(
        1,
        Math.ceil(totalItemsAfterDelete / (data?.meta.limit || 10))
      );

      if (page > totalPagesAfterDelete) {
        setPage(totalPagesAfterDelete);
      }

      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to delete FAQ"
      );
    },
  });

  const faqs = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  const isSubmitting =
    createFaqMutation.isPending || updateFaqMutation.isPending;

  const handleCreate = () => {
    setSelectedFaq(null);
    form.reset(defaultValues);
    setIsFormOpen(true);
  };

  const handleEdit = (faq: FaqItem) => {
    setSelectedFaq(faq);
    form.reset({
      question: faq.question,
      answer: faq.answer,
      status: faq.status,
    });
    setIsFormOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsFormOpen(open);

    if (!open) {
      setSelectedFaq(null);
      form.reset(defaultValues);
    }
  };

  const onSubmit = (values: FaqFormValues) => {
    if (selectedFaq) {
      updateFaqMutation.mutate({ id: selectedFaq._id, values });
      return;
    }

    createFaqMutation.mutate(values);
  };

  if (sessionStatus === "loading") {
    return (
      <div className="p-6">
        <TableSkeletonWrapper height="420px" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="p-6">
        <ErrorContainer message="Session expired. Please login again to manage FAQs." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorContainer
          message={(error as Error)?.message || "Failed to load FAQs"}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="w-full flex items-center justify-end">
           <Button
            onClick={handleCreate}
            className="h-[48px] rounded-[10px] bg-primary px-5 text-base font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add New FAQ
          </Button>
      </div>

      <div className="rounded-[16px] border border-[#E6E7E6] bg-white shadow-[0px_4px_10px_0px_#00000012]">
        <div className="flex flex-col gap-3 border-b border-[#ECEEF2] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[#343A40]">
              FAQ List
            </h3>
            <p className="pt-1 text-sm text-[#68706A]">
              Review published answers and manage their visibility.
            </p>
          </div>
          {isFetching ? (
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Refreshing data
            </div>
          ) : null}
        </div>

        <div className="px-6 py-6">
          {isLoading ? (
            <TableSkeletonWrapper height="320px" />
          ) : faqs.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[14px] border border-dashed border-primary/20 bg-primary/5 px-4 text-center">
              <h4 className="pt-4 text-xl font-semibold text-[#343A40]">
                No FAQs yet
              </h4>
              <p className="max-w-[420px] pt-2 text-sm leading-6 text-[#68706A]">
                Start by adding your first frequently asked question so admins
                can keep support content organized here.
              </p>
              <Button
                onClick={handleCreate}
                className="mt-5 h-[46px] rounded-[10px] bg-primary px-5 text-white hover:bg-primary/90"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create First FAQ
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-[14px] border border-[#ECEEF2]">
                <Table>
                  <TableHeader className="bg-[#F8F9FA]">
                    <TableRow className="border-[#ECEEF2] hover:bg-[#F8F9FA]">
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Question
                      </TableHead>
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Answer
                      </TableHead>
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Status
                      </TableHead>
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Created
                      </TableHead>
                      <TableHead className="px-4 py-4 text-right text-sm font-semibold text-[#343A40]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {faqs.map((faq) => (
                      <TableRow
                        key={faq._id}
                        className="border-[#ECEEF2] bg-white hover:bg-primary/5"
                      >
                        <TableCell className="px-4 py-4">
                          <div className="max-w-[280px]">
                            <p className="font-semibold leading-6 text-[#343A40]">
                              {faq.question}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <p className="max-w-[420px] line-clamp-2 text-sm leading-6 text-[#68706A]">
                            {faq.answer}
                          </p>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={getStatusStyles(faq.status)}
                          >
                            {faq.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-2 text-sm text-[#68706A]">
                            <CalendarClock className="h-4 w-4 text-primary" />
                            {formatDate(faq.createdAt)}
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => handleEdit(faq)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition hover:bg-primary hover:text-white"
                            >
                              <PenSquare className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setFaqToDelete(faq)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="px-1 pt-5">
                <CustomPagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={meta?.total}
                  pageSize={meta?.limit}
                  itemLabel="FAQs"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-[720px] rounded-[16px] border-none bg-white p-0">
          <DialogHeader className="border-b border-[#ECEEF2] px-6 py-5">
            <DialogTitle className="text-2xl font-semibold text-[#343A40]">
              {selectedFaq ? "Update FAQ" : "Create New FAQ"}
            </DialogTitle>
            <DialogDescription className="pt-1 text-sm leading-6 text-[#68706A]">
              {selectedFaq
                ? "Refine the answer, question, or visibility status for this FAQ."
                : "Write a clear question and answer so users can quickly find help."}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-[#343A40]">
                        Question
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter the frequently asked question..."
                          className="h-[52px] rounded-[10px] border-[#E0E4EC] bg-[#EDF2F6] px-4 text-base text-[#343A40] placeholder:text-[#9AA3AE]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="answer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-[#343A40]">
                        Answer
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Write a helpful answer for your users..."
                          className="min-h-[160px] rounded-[10px] border-[#E0E4EC] bg-[#EDF2F6] px-4 py-3 text-base text-[#343A40] placeholder:text-[#9AA3AE]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-[#343A40]">
                        Status
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-[52px] rounded-[10px] border-[#E0E4EC] bg-[#EDF2F6] px-4 text-base text-[#343A40]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogChange(false)}
                    className="h-[48px] rounded-[10px] border-primary bg-transparent px-6 text-base font-semibold text-primary hover:bg-primary hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-[48px] rounded-[10px] bg-primary px-6 text-base font-semibold text-white hover:bg-primary/90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {selectedFaq ? "Updating..." : "Creating..."}
                      </>
                    ) : selectedFaq ? (
                      "Update FAQ"
                    ) : (
                      "Create FAQ"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteModal
        isOpen={!!faqToDelete}
        onClose={() => setFaqToDelete(null)}
        onConfirm={() =>
          faqToDelete ? deleteFaqMutation.mutate(faqToDelete._id) : undefined
        }
        title="Delete this FAQ?"
        desc={`This will permanently remove "${faqToDelete?.question ?? "this FAQ"}" from the list.`}
      />
    </div>
  );
};

export default FaqContainer;
