 'use client';

import { useState, useEffect, useCallback } from "react";
import { useCode } from "../contexts/CodeContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Spinner } from "./ui/spinner";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatInterface() {
  const { code, language, setOnSubmit, setCode, setLanguage } = useCode();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI interviewer. Let's start by picking a topic. What would you like to practice today? (e.g., Arrays, Strings, Dynamic Programming, Trees, Graphs)",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitCode = useCallback(async () => {
    const submitMessage =
      "Please evaluate my solution and let me know if I pass or fail the interview.";
    const newMessages = [
      ...messages,
      { role: "user" as const, content: submitMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          code,
          language,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: `Error: ${data.error}. Please check your API key configuration.`,
          },
        ]);
        setIsLoading(false);
        return;
      }

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.response,
        },
      ]);

      if (data.codeTemplate) {
        if (data.templateLanguage && data.templateLanguage !== language) {
          setLanguage(data.templateLanguage);
        }
        setCode(data.codeTemplate);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "Sorry, there was an error communicating with the AI. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, code, language, setCode, setLanguage]);

  useEffect(() => {
    setOnSubmit(handleSubmitCode);
  }, [handleSubmitCode, setOnSubmit]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const newMessages = [
      ...messages,
      { role: "user" as const, content: input },
    ];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          code,
          language,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: `Error: ${data.error}. Please check your API key configuration.`,
          },
        ]);
        setIsLoading(false);
        return;
      }

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.response,
        },
      ]);

      if (data.codeTemplate) {
        if (data.templateLanguage && data.templateLanguage !== language) {
          setLanguage(data.templateLanguage);
        }
        setCode(data.codeTemplate);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "Sorry, there was an error communicating with the AI. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-950">
      <div className="shrink-0 border-b border-slate-800/60 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-100">AI Interview Assistant</h2>
        <p className="text-xs text-zinc-500">Conversational coding interview with live code context.</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <ScrollArea className="flex-1 space-y-4 px-4 py-3">
          {messages.map((message) => (
            <div
              key={`${message.role}-${message.content.slice(0, 24)}`}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 text-sm shadow-sm ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200/80 bg-gray-100 text-gray-900 shadow-xs dark:border-gray-800/80 dark:bg-gray-900 dark:text-gray-50"
                }`}
              >
                <div
                  className={`prose prose-sm max-w-none ${
                    message.role === "user"
                      ? "prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-code:text-blue-200 prose-pre:bg-blue-700"
                      : "dark:prose-invert prose-pre:bg-gray-100 dark:prose-pre:bg-gray-950 prose-code:text-blue-600 dark:prose-code:text-blue-400"
                  }`}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg border border-gray-200/80 bg-gray-100 px-4 py-3 text-gray-900 shadow-sm dark:border-gray-800/80 dark:bg-gray-900 dark:text-gray-50">
                <div className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Just a second...
                  </span>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-slate-800/60 bg-slate-900/80 px-4 py-3">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask a question or describe a problem..."
          className="flex-1 border-slate-700 bg-slate-900 text-zinc-100 placeholder:text-zinc-500"
        />
        <Button
          onClick={handleSend}
          disabled={isLoading}
          className="whitespace-nowrap"
        >
          {isLoading ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}


