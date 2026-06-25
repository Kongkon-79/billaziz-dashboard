"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const passwordSchema = z
  .string()
  .min(8, {
    message: "Minimum 8-12 characters (recommend 12+ for stronger security).",
  })
  .regex(/[A-Z]/, { message: "At least one uppercase letter must." })
  .regex(/[a-z]/, { message: "At least one lowercase letter must." })
  .regex(/[0-9]/, { message: "At least one number must (0-9)." })
  .regex(/[^A-Za-z0-9]/, {
    message: "At least special character (! @ # $ % ^ & * etc.).",
  })
  .refine((val) => !/\s/.test(val), { message: "No spaces allowed." });

const formSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Current password is required" }),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

export default function ChangePasswordForm() {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const session = useSession();
  const token = (session?.data?.user as { accessToken: string })?.accessToken;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const newPassword = form.watch("newPassword");

  const checks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    noSpace: !/\s/.test(newPassword),
  };

  const { mutate, isPending } = useMutation({
    mutationKey: ["change-password"],
    mutationFn: async (values: {
      oldPassword: string;
      newPassword: string;
    }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(values),
        },
      );
      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Unable to change password");
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Password changed successfully");
      form.reset();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to change password",
      );
    },
  });

  function onSubmit(values: FormValues) {
    const payload = {
      oldPassword: values?.currentPassword,
      newPassword: values?.newPassword,
    };

    mutate(payload);
  }

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 rounded-[12px] border border-[#E6E7E6] bg-white p-4 shadow-[0px_4px_12px_0px_#0000000D] md:p-6"
        >
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold leading-normal text-[#343A40] md:text-2xl">
                Change Password
              </h2>
              <p className="pt-1 text-sm font-normal leading-normal text-[#68706A]">
                Keep your account secure by choosing a strong, unique password.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Current Password */}
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold text-[#343A40] leading-[150%]">
                      Current Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="h-[52px] w-full rounded-[8px] border border-[#E0E4EC] bg-[#EDF2F6] px-4 py-3 pr-12 text-base font-medium leading-[150%] text-[#343A40] placeholder:text-[#b0afaf] focus-visible:ring-primary"
                          type={showPasswords.current ? "text" : "password"}
                          placeholder="••••••••••••"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#68706A] transition hover:text-primary"
                          aria-label={
                            showPasswords.current
                              ? "Hide current password"
                              : "Show current password"
                          }
                          onClick={() =>
                            setShowPasswords((s) => ({
                              ...s,
                              current: !s.current,
                            }))
                          }
                        >
                          {showPasswords.current ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              {/* New Password */}
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold text-[#343A40] leading-[150%]">
                      New Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="h-[52px] w-full rounded-[8px] border border-[#E0E4EC] bg-[#EDF2F6] px-4 py-3 pr-12 text-base font-medium leading-[150%] text-[#343A40] placeholder:text-[#b0afaf] focus-visible:ring-primary"
                          type={showPasswords.new ? "text" : "password"}
                          placeholder="••••••••••••"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#68706A] transition hover:text-primary"
                          aria-label={
                            showPasswords.new
                              ? "Hide new password"
                              : "Show new password"
                          }
                          onClick={() =>
                            setShowPasswords((s) => ({ ...s, new: !s.new }))
                          }
                        >
                          {showPasswords.new ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              {/* Confirm New Password */}
              <FormField
                control={form.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold text-[#343A40] leading-[150%]">
                      Confirm New Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="h-[52px] w-full rounded-[8px] border border-[#E0E4EC] bg-[#EDF2F6] px-4 py-3 pr-12 text-base font-medium leading-[150%] text-[#343A40] placeholder:text-[#b0afaf] focus-visible:ring-primary"
                          type={showPasswords.confirm ? "text" : "password"}
                          placeholder="••••••••••••"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#68706A] transition hover:text-primary"
                          aria-label={
                            showPasswords.confirm
                              ? "Hide password confirmation"
                              : "Show password confirmation"
                          }
                          onClick={() =>
                            setShowPasswords((s) => ({
                              ...s,
                              confirm: !s.confirm,
                            }))
                          }
                        >
                          {showPasswords.confirm ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-[10px] border border-[#E6E7E6] bg-[#F8F9FA] p-4">
            <p className="mb-3 text-sm font-semibold text-[#343A40]">
              Password requirements
            </p>
            <ul className="grid gap-3 text-sm md:grid-cols-2">
              <li className="flex items-center gap-2">
                {checks.length ? (
                  <Check className="text-[#1F9854]" size={18} />
                ) : (
                  <X className="text-[#E5102E]" size={18} />
                )}
                <span
                  className={checks.length ? "text-[#1F9854]" : "text-[#E5102E]"}
                >
                  Minimum 8-12 characters (recommend 12+ for stronger security).
                </span>
              </li>
              <li className="flex items-center gap-2">
                {checks.uppercase ? (
                  <Check className="text-[#1F9854]" size={18} />
                ) : (
                  <X className="text-[#E5102E]" size={18} />
                )}
                <span
                  className={
                    checks.uppercase ? "text-[#1F9854]" : "text-[#E5102E]"
                  }
                >
                  At least one uppercase letter must.
                </span>
              </li>
              <li className="flex items-center gap-2">
                {checks.lowercase ? (
                  <Check className="text-[#1F9854]" size={18} />
                ) : (
                  <X className="text-[#E5102E]" size={18} />
                )}
                <span
                  className={
                    checks.lowercase ? "text-[#1F9854]" : "text-[#E5102E]"
                  }
                >
                  At least one lowercase letter must.
                </span>
              </li>
              <li className="flex items-center gap-2">
                {checks.number ? (
                  <Check className="text-[#1F9854]" size={18} />
                ) : (
                  <X className="text-[#E5102E]" size={18} />
                )}
                <span
                  className={checks.number ? "text-[#1F9854]" : "text-[#E5102E]"}
                >
                  At least one number must (0-9).
                </span>
              </li>
              <li className="flex items-center gap-2">
                {checks.special ? (
                  <Check className="text-[#1F9854]" size={18} />
                ) : (
                  <X className="text-[#E5102E]" size={18} />
                )}
                <span
                  className={
                    checks.special ? "text-[#1F9854]" : "text-[#E5102E]"
                  }
                >
                  At least special character (! @ # $ % ^ & * etc.).
                </span>
              </li>
              <li className="flex items-center gap-2">
                {checks.noSpace ? (
                  <Check className="text-[#1F9854]" size={18} />
                ) : (
                  <X className="text-[#E5102E]" size={18} />
                )}
                <span
                  className={
                    checks.noSpace ? "text-[#1F9854]" : "text-[#E5102E]"
                  }
                >
                  No spaces allowed.
                </span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#E6E7E6] pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              className="h-12 rounded-[8px] border-primary px-6 font-semibold text-primary hover:bg-[#FFF7F2] hover:text-primary"
            >
              Discard Changes
            </Button>
            <Button
              disabled={isPending}
              type="submit"
              className="h-12 rounded-[8px] bg-primary px-8 font-semibold text-white hover:bg-primary/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
