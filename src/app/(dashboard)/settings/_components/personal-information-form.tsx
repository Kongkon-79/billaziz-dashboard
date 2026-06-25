"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Mail, Phone, UserRound } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  phoneNumber: z.string().trim().optional(),
  gender: z.enum(["male", "female"]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type Profile = ProfileFormValues & {
  _id: string;
  profilePicture?: string;
  createdAt?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

const inputClassName =
  "h-[52px] rounded-[8px] border-[#E0E4EC] bg-[#EDF2F6] px-4 text-base text-[#343A40] placeholder:text-[#9CA3AF] focus-visible:ring-primary";

export default function PersonalInformationForm() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const token = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      gender: "male",
    },
  });

  const profileQuery = useQuery({
    queryKey: ["settings-profile"],
    enabled: status === "authenticated" && Boolean(token),
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const result: ApiResponse<Profile> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load profile");
      }

      return result.data;
    },
  });

  useEffect(() => {
    if (!profileQuery.data) return;

    form.reset({
      fullName: profileQuery.data.fullName || "",
      email: profileQuery.data.email || "",
      phoneNumber: profileQuery.data.phoneNumber || "",
      gender: profileQuery.data.gender || "male",
    });
  }, [form, profileQuery.data]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const updateProfile = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const formData = new FormData();
      formData.append("fullName", values.fullName);
      formData.append("email", values.email);
      formData.append("phoneNumber", values.phoneNumber || "");
      formData.append("gender", values.gender);
      if (profileFile) formData.append("profilePicture", profileFile);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/profile`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );
      const result: ApiResponse<Profile> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update profile");
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["settings-profile"], result.data);
      setProfileFile(null);
      setPreviewUrl("");
      toast.success(result.message || "Profile updated successfully");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update profile",
      );
    },
  });

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile image must be smaller than 5MB");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setProfileFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const discardChanges = () => {
    if (!profileQuery.data) return;
    form.reset({
      fullName: profileQuery.data.fullName || "",
      email: profileQuery.data.email || "",
      phoneNumber: profileQuery.data.phoneNumber || "",
      gender: profileQuery.data.gender || "male",
    });
    setProfileFile(null);
    setPreviewUrl("");
  };

  if (profileQuery.isLoading || status === "loading") {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-[12px] border border-[#E6E7E6] bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="rounded-[12px] border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        {profileQuery.error instanceof Error
          ? profileQuery.error.message
          : "Unable to load profile"}
      </div>
    );
  }

  const profileImage =
    previewUrl || profileQuery.data?.profilePicture || "/assets/images/no-user.jpeg";
  const joinedDate = profileQuery.data?.createdAt
    ? new Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(profileQuery.data.createdAt))
    : "N/A";

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => updateProfile.mutate(values))}
        className="space-y-6 rounded-[12px] border border-[#E6E7E6] bg-white p-4 shadow-[0px_4px_12px_0px_#0000000D] md:p-6"
      >
        <div>
          <h2 className="text-xl font-semibold text-[#343A40] md:text-2xl">
            Personal Information
          </h2>
          <p className="mt-1 text-sm text-[#68706A]">
            Manage your personal information and profile details.
          </p>
        </div>

        <div className="flex flex-col gap-5 rounded-[12px] bg-[#F8F9FA] p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <div className="flex items-center gap-4">
            <div className="relative h-[76px] w-[76px] shrink-0">
              <Image
                src={profileImage}
                alt={profileQuery.data?.fullName || "Profile"}
                fill
                unoptimized
                className="rounded-full border-2 border-white object-cover shadow-sm"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-sm"
                aria-label="Change profile picture"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div>
              <p className="text-lg font-semibold text-[#343A40]">
                {profileQuery.data?.fullName}
              </p>
              <p className="text-sm text-[#68706A]">
                {profileQuery.data?.email}
              </p>
              <span className="mt-2 inline-flex rounded-full bg-[#FFF0E6] px-2.5 py-1 text-xs font-medium capitalize text-primary">
                {profileQuery.data?.gender}
              </span>
            </div>
          </div>

          <div className="md:text-right">
            <p className="text-xs text-[#8B928D]">Member since</p>
            <p className="mt-1 text-sm font-semibold text-[#343A40]">
              {joinedDate}
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-[#343A40]">
                  Full Name
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B928D]" />
                    <Input
                      {...field}
                      placeholder="Enter your full name"
                      className={`${inputClassName} pl-11`}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-[#343A40]">
                  Email Address
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B928D]" />
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter your email"
                      className={`${inputClassName} pl-11`}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-[#343A40]">
                  Phone Number
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B928D]" />
                    <Input
                      {...field}
                      placeholder="Enter your phone number"
                      className={`${inputClassName} pl-11`}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-[#343A40]">
                  Gender
                </FormLabel>
                <FormControl>
                  <div className="grid h-[52px] grid-cols-2 gap-2 rounded-[8px] border border-[#E0E4EC] bg-[#EDF2F6] p-1.5">
                    {(["male", "female"] as const).map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => field.onChange(gender)}
                        className={`rounded-[6px] text-sm font-semibold capitalize transition ${
                          field.value === gender
                            ? "bg-primary text-white shadow-sm"
                            : "text-[#68706A] hover:bg-white"
                        }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#E6E7E6] pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={discardChanges}
            disabled={updateProfile.isPending}
            className="h-12 rounded-[8px] border-primary px-6 font-semibold text-primary hover:bg-[#FFF7F2] hover:text-primary"
          >
            Discard Changes
          </Button>
          <Button
            type="submit"
            disabled={updateProfile.isPending || !token}
            className="h-12 rounded-[8px] bg-primary px-8 font-semibold text-white hover:bg-primary/90"
          >
            {updateProfile.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
