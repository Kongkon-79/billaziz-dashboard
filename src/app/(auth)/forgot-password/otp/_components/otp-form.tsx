"use client";

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
// import logo from "../../../../../../public/assets/images/logo.png"

export default function OtpForm() {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const decodedEmail = decodeURIComponent(email || "");
  const router = useRouter();

  // Focus the first input on component mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1); // Only take the first character

    setOtp(newOtp);

    // Auto-focus next input if value is entered
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current input is empty
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0 &&
      inputRefs.current[index - 1]
    ) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle arrow keys for navigation
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // otp api integration
  const { mutate, isPending } = useMutation({
    mutationKey: ["verify-otp"],
    mutationFn: (values: { otp: string; email: string }) =>
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(values),
      }).then((res) => res.json()),
    onSuccess: (data) => {
      if (!data?.success) {
        toast.error(data?.message || "Something went wrong");
        return;
      } else {
        toast.success(data?.message || "Email sent successfully!");
        router.push(
          `/forgot-password/otp/reset-password?email=${encodeURIComponent(decodedEmail)}`
        );
      }
    },
  });

  // reset otp api integrattion
  const { mutate: resentOtp, isPending: resentOtpPending } = useMutation({
    mutationKey: ["fotgot-password"],
    mutationFn: (email: string) =>
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email }),
      }).then((res) => res.json()),
    onSuccess: (data, email) => {
      if (!data?.success) {
        toast.error(data?.message || "Something went wrong");
        return;
      } else {
        toast.success(data?.message || "Email sent successfully!");
        router.push(`/forgot-password/otp?email=${encodeURIComponent(email)}`);
      }
    },
  });

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    // Check if pasted content is a valid 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);

      // Focus the last input
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    }
  };

  // handle resend otp
  const handleResendOtp = async () => {
    resentOtp(decodedEmail);
  };

  // handle verify otp
  const handleVerify = async () => {
    const otpValue = otp.join("");

    // Check if OTP is complete
    if (otpValue.length !== 6) {
      toast.error("Please enter all 6 digits of the OTP.");
      return;
    }
    mutate({ otp: otpValue, email: decodedEmail });

    console.log("OTP Verified:", otpValue);
  };

  return (
    <div className="">
      <div className="w-full md:w-[570px] bg-white rounded-[16px] border-[2px] border-[#E7E7E7] shadow-[0px_0px_32px_0px_#0000001F] p-5 md:p-6">
        <div className="w-full flex items-center justify-center pb-6">
          <Link href="/">
          <Image src="/assets/images/logo.png" alt="auth logo" width={500} height={500} className="w-[174px] h-[94px] object-contain" />
          </Link>
        </div>

        <h3 className="text-2xl md:text-[32px] lg:text-[40px] font-bold text-[#131313] text-center leading-[120%] ">
          Enter OTP
        </h3>
         <p className="text-base md:text-lg font-normal text-[#787878] leading-[150%] text-center pt-2 pb-6">
          An OTP has been sent to your email address <br className="hidden md:block"/> please verify it below
        </p>
        {/* OTP Input Fields */}
        <div className="flex gap-[10px] md:gap-5 lg:gap-6 w-full justify-center">
          {otp.map((digit, index) => (
            <Input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              className={` w-[54px] md:w-[60px] lg:w-[54px] h-[56px] md:h-[60px] lg:h-[64px] border border-[#606060] bg-[#EAEAEA] text-[#212121] placeholder:text-[#999999] text-center tracking-[0%] !text-xl font-semibold leading-[120%] focus:outline-none rounded-[8px] ${digit ? "border-[#212121]" : "border-black"
                }`}
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>

        {/* Resend OTP */}
        <div className="text-center flex items-center justify-between pt-5 lg:pt-6 pb-5 lg:pb-6">
          <span className=" text-base font-medium leading-[120%] text-black tracking-[0%]">
            Didn&apos;t Receive OTP?{" "}
          </span>
          <button
            onClick={handleResendOtp}
            disabled={resentOtpPending}
            className=" text-base font-medium leading-[120%] text-[#8C311E] tracking-[0%] hover:underline"
          >
            {resentOtpPending ? "Resending..." : "Resend OTP"}
          </button>
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          type="submit"
          className="w-full h-[52px] bg-primary rounded-[8px] py-[15px] px-[151px] text-lg font-semibold  leading-[120%] tracking-[0%] text-[#F4F4F4]"
          disabled={isPending}
        >
          {isPending ? "Verifying..." : "Verify"}
        </button>
      </div>
    </div>
  );
}