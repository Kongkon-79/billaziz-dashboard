"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  Loader2,
  MessageCircle,
  RefreshCcw,
  UserRound,
} from "lucide-react";
import { useSession } from "next-auth/react";

import ErrorContainer from "@/components/shared/ErrorContainer/ErrorContainer";
import TableSkeletonWrapper from "@/components/shared/TableSkeletonWrapper/TableSkeletonWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ChatSessionsResponse = {
  success: boolean;
  count: number;
  sessions: string[];
  message?: string;
};

type ChatHistoryResponse = {
  success: boolean;
  statuscode?: number;
  data?: {
    user_id?: string;
    history?: ChatMessage[];
  };
  message?: string;
};

type DirectChatHistoryResponse = {
  status?: boolean;
  statuscode?: number;
  text?: {
    user_id?: string;
    history?: ChatMessage[];
  };
  message?: string;
};

const buildAiApiUrl = (path: string, httpsFallbackPath: string) => {
  const aiApiBaseUrl = process.env.NEXT_PUBLIC_AI_API_BASE_URL?.trim();

  if (!aiApiBaseUrl) return httpsFallbackPath;

  const directUrl = `${aiApiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  if (typeof window === "undefined") return directUrl;

  return window.location.protocol === "https:" ? httpsFallbackPath : directUrl;
};

const normalizeHistoryResponse = (
  result: ChatHistoryResponse | DirectChatHistoryResponse,
): ChatHistoryResponse => {
  if ("status" in result) {
    return {
      success: Boolean(result.status),
      statuscode: result.statuscode,
      data: result.text,
      message: result.message,
    };
  }

  if ("success" in result) return result;

  return {
    success: false,
    statuscode: result.statuscode,
    message: result.message || "Failed to fetch chat history",
  };
};

const getSessionLabel = (index: number) => `User ${index + 1}`;

const getMessageStyles = (role: ChatRole) =>
  role === "user"
    ? "ml-auto rounded-br-[4px] bg-primary text-white"
    : "mr-auto rounded-bl-[4px] bg-[#F3F6F8] text-[#343A40]";

const AiConversationContainer = () => {
  const { status: sessionStatus } = useSession();
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const {
    data: sessionsResponse,
    isLoading: isSessionsLoading,
    isError: isSessionsError,
    error: sessionsError,
    isFetching: isSessionsFetching,
    refetch: refetchSessions,
  } = useQuery<ChatSessionsResponse>({
    queryKey: ["ai-chat-sessions"],
    queryFn: async () => {
      const response = await fetch(
        buildAiApiUrl("/chat/sessions", "/api/admin/chat/sessions"),
        {
          headers: {
            accept: "application/json",
          },
        },
      );
      const result: ChatSessionsResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch chat sessions");
      }

      return result;
    },
    enabled: sessionStatus === "authenticated",
  });

  const sessions = useMemo(
    () => sessionsResponse?.sessions ?? [],
    [sessionsResponse?.sessions],
  );

  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      setSelectedSessionId(sessions[0]);
    }
  }, [selectedSessionId, sessions]);

  const selectedSessionIndex = sessions.findIndex(
    (sessionId) => sessionId === selectedSessionId,
  );
  const selectedSessionLabel =
    selectedSessionIndex >= 0 ? getSessionLabel(selectedSessionIndex) : "";

  const {
    data: historyResponse,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    error: historyError,
    isFetching: isHistoryFetching,
    refetch: refetchHistory,
  } = useQuery<ChatHistoryResponse>({
    queryKey: ["ai-chat-history", selectedSessionId],
    queryFn: async () => {
      const params = new URLSearchParams({ user_id: selectedSessionId });
      const response = await fetch(
        `${buildAiApiUrl("/chat/history/", "/api/admin/chat/history")}?${params.toString()}`,
        {
          headers: {
            accept: "application/json",
          },
        },
      );
      const rawResult: ChatHistoryResponse | DirectChatHistoryResponse =
        await response.json();
      const result = normalizeHistoryResponse(rawResult);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch chat history");
      }

      return result;
    },
    enabled: sessionStatus === "authenticated" && Boolean(selectedSessionId),
  });

  if (sessionStatus === "loading") {
    return (
      <div className="p-4 md:p-6">
        <TableSkeletonWrapper height="420px" />
      </div>
    );
  }

  if (sessionStatus !== "authenticated") {
    return (
      <div className="p-4 md:p-6">
        <ErrorContainer message="Session expired. Please login again to view AI conversations." />
      </div>
    );
  }

  if (isSessionsError) {
    return (
      <div className="p-4 md:p-6">
        <ErrorContainer
          message={
            sessionsError instanceof Error
              ? sessionsError.message
              : "Failed to load AI conversations"
          }
        />
      </div>
    );
  }

  const messages = historyResponse?.data?.history ?? [];

  return (
    <div className="p-4 md:p-6">
      <section className="overflow-visible rounded-[16px] border border-[#E6E7E6] bg-white shadow-[0px_4px_10px_0px_#00000012]">
        <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
          <aside className="border-b border-[#ECEEF2] bg-[#F8F9FA] p-5 lg:sticky lg:top-0 lg:min-h-screen lg:self-start lg:border-r lg:border-b-0 md:p-6">
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-[#343A40]">
                  AI Conversation History
                </h2>
                <p className="pt-1 text-sm leading-6 text-[#68706A]">
                  Select a chat user and inspect the conversation.
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-[#343A40]">
                  Chat User
                </label>
                <Select
                  value={selectedSessionId}
                  onValueChange={setSelectedSessionId}
                  disabled={isSessionsLoading || sessions.length === 0}
                >
                  <SelectTrigger className="mt-2 h-11 rounded-[10px] bg-white">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px] bg-white">
                    {sessions.map((sessionId, index) => (
                      <SelectItem key={sessionId} value={sessionId}>
                        {getSessionLabel(index)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-[14px] border border-[#E6E7E6] bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageCircle className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm text-[#68706A]">Total sessions</p>
                    <p className="text-2xl font-semibold text-[#343A40]">
                      {sessionsResponse?.count ?? sessions.length}
                    </p>
                  </div>
                </div>
              </div>

              {selectedSessionId ? (
                <div className="rounded-[14px] border border-[#E6E7E6] bg-white p-4">
                  <p className="text-sm font-semibold text-[#343A40]">
                    {selectedSessionLabel}
                  </p>
                  <p className="mt-2 break-all text-xs leading-5 text-[#68706A]">
                    {selectedSessionId}
                  </p>
                </div>
              ) : null}

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-[10px] bg-white"
                onClick={() => {
                  refetchSessions();
                  if (selectedSessionId) refetchHistory();
                }}
                disabled={isSessionsFetching || isHistoryFetching}
              >
                {isSessionsFetching || isHistoryFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </aside>

          <div className="min-h-[520px] p-5 md:p-6">
            {isSessionsLoading ? (
              <TableSkeletonWrapper height="360px" />
            ) : sessions.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[14px] border border-dashed border-primary/20 bg-primary/5 px-4 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bot className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-xl font-semibold text-[#343A40]">
                  No conversations found
                </h3>
                <p className="max-w-[440px] pt-2 text-sm leading-6 text-[#68706A]">
                  Chat sessions from the website assistant will appear here.
                </p>
              </div>
            ) : isHistoryLoading ? (
              <TableSkeletonWrapper height="360px" />
            ) : isHistoryError ? (
              <ErrorContainer
                message={
                  historyError instanceof Error
                    ? historyError.message
                    : "Failed to load chat history"
                }
              />
            ) : (
              <div className="flex min-h-[460px] flex-col rounded-[14px] border border-[#ECEEF2] bg-white">
                <div className="flex flex-col gap-3 border-b border-[#ECEEF2] px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-[#343A40]">
                        {selectedSessionLabel || "Selected user"}
                      </h3>
                      <Badge
                        variant="outline"
                        className="border-primary/20 bg-primary/10 text-primary"
                      >
                        {messages.length} messages
                      </Badge>
                    </div>
                    <p className="pt-1 break-all text-xs text-[#68706A]">
                      {historyResponse?.data?.user_id || selectedSessionId}
                    </p>
                  </div>
                  {isHistoryFetching ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading history
                    </div>
                  ) : null}
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-[#FBFCFD] px-4 py-5 md:px-6">
                  {messages.length === 0 ? (
                    <div className="flex min-h-[260px] items-center justify-center text-center text-sm text-[#68706A]">
                      No messages found for this user.
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const isUser = message.role === "user";

                      return (
                        <div
                          key={`${message.role}-${index}-${message.content}`}
                          className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          {!isUser ? (
                            <span className="mt-6 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Bot className="h-5 w-5" />
                            </span>
                          ) : null}

                          <div
                            className={`flex max-w-[min(720px,82%)] flex-col ${
                              isUser ? "items-end" : "items-start"
                            }`}
                          >
                            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#68706A]">
                              {isUser ? "Customer" : "Assistant"}
                            </div>
                            <div
                              className={`rounded-[16px] px-4 py-3 text-sm leading-6 shadow-sm ${getMessageStyles(message.role)}`}
                            >
                              {message.content}
                            </div>
                          </div>

                          {isUser ? (
                            <span className="mt-6 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E9EEF5] text-[#68706A]">
                              <UserRound className="h-5 w-5" />
                            </span>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AiConversationContainer;
