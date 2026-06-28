import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type ChatSessionsResponse = {
  success?: boolean;
  count?: number;
  sessions?: string[];
  message?: string;
};

const aiApiBaseUrl =
  process.env.NEXT_PUBLIC_AI_API_BASE_URL || "http://187.77.187.56:8010/api";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = String(
    (session?.user as { role?: string } | undefined)?.role || "",
  ).toLowerCase();

  if (!session || role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(
      `${aiApiBaseUrl.replace(/\/$/, "")}/chat/sessions`,
      {
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const result: ChatSessionsResponse = await response.json();

    if (!response.ok || !result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "Failed to fetch chat sessions",
        },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({
      success: true,
      count: result.count ?? result.sessions?.length ?? 0,
      sessions: result.sessions ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch chat sessions",
      },
      { status: 500 },
    );
  }
}
