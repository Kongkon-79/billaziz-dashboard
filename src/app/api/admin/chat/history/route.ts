import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatHistoryResponse = {
  status?: boolean;
  statuscode?: number;
  text?: {
    user_id?: string;
    history?: ChatMessage[];
  };
  message?: string;
};

const aiApiBaseUrl =
  process.env.NEXT_PUBLIC_AI_API_BASE_URL || "http://187.77.187.56:8010/api";

export async function GET(request: NextRequest) {
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

  const userId = request.nextUrl.searchParams.get("user_id")?.trim();

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "User id is required" },
      { status: 400 },
    );
  }

  const searchParams = new URLSearchParams({ user_id: userId });

  try {
    const response = await fetch(
      `${aiApiBaseUrl.replace(/\/$/, "")}/chat/history/?${searchParams.toString()}`,
      {
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const result: ChatHistoryResponse = await response.json();

    if (!response.ok || !result.status) {
      return NextResponse.json(
        {
          success: false,
          statuscode: result.statuscode ?? response.status,
          message: result.message || "Failed to fetch chat history",
        },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({
      success: true,
      statuscode: result.statuscode ?? response.status,
      data: result.text ?? { user_id: userId, history: [] },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch chat history",
      },
      { status: 500 },
    );
  }
}
