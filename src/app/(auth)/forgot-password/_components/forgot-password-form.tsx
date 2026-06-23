"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from 'next/image'
import { useMutation } from "@tanstack/react-query";
// import logo from "../../../../../public/assets/images/logo.png"

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
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});



const ForgotPasswordForm = () => {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const {mutate, isPending} = useMutation({
    mutationKey: ["forgot-password"],
    mutationFn : async (values:{email:string})=>{
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/forgot-password`,{
        method : "POST",
        headers: {
          "Content-Type" : "application/json"
        },
        body : JSON.stringify(values)
      });
      return res.json();
    },
    onSuccess: (data, email)=>{
      if(!data?.success){
        toast?.error(data?.message || "Something went wrong");
        return
      }
      toast?.success(data?.message || "OTP sent to your email");
      router.push(`/forgot-password/otp?email=${encodeURIComponent(email?.email)}`)
    }
  })

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
   console.log(values);
   mutate(values)
  }
  return (
    <div>
      <div className="w-full md:w-[570px] bg-white rounded-[16px] border-[2px] border-[#E7E7E7] shadow-[0px_0px_32px_0px_#0000001F] p-5 md:p-6">
        <div className="w-full flex items-center justify-center pb-6">
          <Link href="/">
          <Image src="/assets/images/logo.png" alt="auth logo" width={500} height={500} className="w-[174px] h-[94px] object-contain" />
          </Link>
        </div>

        <h3 className="text-2xl md:text-[32px] lg:text-[40px] font-bold text-[#131313] text-center leading-[120%] ">
          Forgot Password
        </h3>
       <p className="text-base md:text-lg font-normal text-[#787878] leading-[150%] text-center pt-2">
          Please enter the email address linked to your <br className="hidden md:block"/> account. We&apos;ll send a one-time password (OTP) to <br className="hidden md:block"/> your email for verification.
        </p>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-5 md:pt- lg:pt-8"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                   <FormLabel className="text-base font-semibold text-[#2A2A2A] leading-[120%]">Email <sup className="text-[#8C311E]">*</sup></FormLabel>
                  <FormControl>
                    <Input
                       className="h-[48px] bg-[#EAEAEA] !rounded-[8px] text-base font-medium text-[#131313] py-3 px-4 border-none placeholder:text-[#787878]"
                      placeholder="Enter your email address..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <div className="pt-2">
              <Button
                disabled={isPending}
                className={`text-base font-medium text-white cursor-pointer leading-[120%] rounded-[8px] py-4 w-full h-[51px] ${
                  isPending ? "opacity-50 cursor-not-allowed" : "bg-primary"
                }`}
                type="submit"
              >
                {isPending ? "Sending..." : "Send OTP"}
              </Button>
            </div>
            <div>
              <p className="text-sm text-[#363636] font-medium text-center pt-2 leading-[120%] ">Back to <Link className="text-[#23547B] underline" href="/login">Log In</Link></p>
              </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
