




// "use client";

// import Image from "next/image";
// import { useQuery } from "@tanstack/react-query";
// import { useSession } from "next-auth/react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import TableSkeletonWrapper from "@/components/shared/TableSkeletonWrapper/TableSkeletonWrapper";
// import ErrorContainer from "@/components/shared/ErrorContainer/ErrorContainer";
// import NotFound from "@/components/shared/NotFound/NotFound";
// import { PaymentApiResponse } from "../payment-and-transactions/_components/payment-data-type";
// import noUser from "../../../../public/assets/images/no-user.jpeg"
// import moment from "moment";
// import Link from "next/link";

// export function RecentTransactions() {
//   const { data: session } = useSession();
//   const token = (session?.user as { accessToken?: string })?.accessToken;

//   const {
//     data,
//     isLoading,
//     isError,
//     error,
//   } = useQuery<PaymentApiResponse>({
//     queryKey: ["recent-transactions"],
//     queryFn: async () => {
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_BACKEND_URL}/payment`,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (!res.ok) {
//         throw new Error("Failed to fetch recent transactions");
//       }

//       return res.json();
//     },
//     enabled: !!token,
//   });

//   console.log("Recent Transactions Data:", data?.data);

//   if (isLoading) {
//     return (
//       <div className="pt-4 pb-10 px-6">
//         <TableSkeletonWrapper count={3} />
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div className="px-6 pb-10">
//         <ErrorContainer
//         message={(error as Error)?.message || "Something went wrong"}
//       />
//       </div>
//     );
//   }

//   if (!data?.data?.length) {
//     return <NotFound message="No recent transactions found." />;
//   }

//   return (
//     <div className="px-6 pb-10">
//       <Card className="rounded-2xl border border-[#E9ECEF] shadow-none">
//       <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
//         <CardTitle className="text-base md:text-lg font-semibold leading-normal text-[#343A40]">
//           Recent Transactions
//         </CardTitle>
//         <Link href="/payment-and-transactions" className="text-base md:text-lg font-semibold leading-normal text-[#343A40] hover:underline">
//           See More
//         </Link>
//       </CardHeader>

//       <CardContent className="pt-0">
//         <div className="overflow-hidden rounded-xl border border-[#F1F5F9]">
//           {data?.data?.slice(0,3)?.map((item, index) => (
//             <div
//               key={item._id}
//               className={`grid grid-cols-1 md:grid-cols-4 gap-3 px-4 py-4 transition-colors hover:bg-[#F8FAFC] sm:items-center sm:gap-4 sm:px-5 ${
//                 index !== data.data.length - 1 ? "border-b border-[#EEF2F7]" : ""
//               }`}
//             >
//               <div className="flex items-center gap-3 min-w-0">
//                 <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-[#E5E7EB]">
//                   <Image
//                     src={item?.user?.profilePicture || noUser}
//                     alt={item?.user?.fullName || "User Avatar"}
//                     fill
//                     sizes="40px"
//                     className="object-cover"
//                   />
//                 </div>

//                 <p className="truncate text-sm font-semibold text-[#111827] sm:text-[15px]">
//                   {item?.user?.fullName || "Unknown User"}
//                 </p>
//               </div>
//                <p className="text-sm text-[#6B7280] sm:text-[14px] sm:text-center">
//                 {item?.user?.email || "N/A"}
//               </p>

//               <p className="text-sm text-[#6B7280] sm:text-[14px] sm:text-center">
//                 {item?.subscribe?.planName || "N/A"}
//               </p>

//               <p className="text-sm text-[#6B7280] sm:text-[14px] sm:text-center">
//                 {moment(item?.createdAt).fromNow()}
//               </p>
//             </div>
//           ))}
//         </div>
//       </CardContent>
//     </Card>
//     </div>
//   );
// }