import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type ReindexResponse = {
  status?: boolean;
  statuscode?: number;
  text?: {
    total_docs?: number;
    total_chunks?: number;
    collections?: string[];
  };
  message?: string;
};

const aiApiBaseUrl =
  process.env.NEXT_PUBLIC_AI_API_BASE_URL || "http://187.77.187.56:8010/api";
const reindexUrl = `${aiApiBaseUrl.replace(/\/$/, "")}/admin/reindex`;
const reindexApiKey = process.env.NEXT_PUBLIC_AI_REINDEX_API_KEY;

export async function POST() {
  const session = await getServerSession(authOptions);
  const role = String((session?.user as { role?: string } | undefined)?.role || "").toLowerCase();

  if (!session || role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!reindexApiKey) {
    return NextResponse.json(
      { success: false, message: "AI reindex API key is not configured" },
      { status: 500 }
    );
  }

  const body = new URLSearchParams();
  body.set("api_key", reindexApiKey);

  try {
    const res = await fetch(reindexUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      cache: "no-store",
      body: body.toString(),
    });

    const response: ReindexResponse = await res.json();

    if (!res.ok || !response?.status) {
      return NextResponse.json(
        {
          success: false,
          statuscode: response?.statuscode ?? res.status,
          message: response?.message || "Failed to update AI knowledge",
        },
        { status: res.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      statuscode: response.statuscode ?? res.status,
      message: "AI knowledge updated successfully",
      data: response.text,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update AI knowledge",
      },
      { status: 500 }
    );
  }
}
