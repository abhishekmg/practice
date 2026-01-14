 'use client';

import Editor from "@monaco-editor/react";
import { useCode } from "../contexts/CodeContext";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

export default function CodeEditor() {
  const { code, setCode, language, setLanguage, resetCode, submitCode } =
    useCode();

  return (
    <Card className="flex h-full flex-col border-gray-200/60 bg-slate-950/90 text-slate-50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">
            Code Editor
          </CardTitle>
          <p className="text-xs text-slate-400">
            Write and refine your solution while chatting with the AI.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="h-8 rounded-md border border-slate-700/80 bg-slate-900/80 px-2.5 text-xs text-slate-100 shadow-sm outline-none ring-1 ring-transparent transition focus:border-blue-500 focus:ring-blue-500/60"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => setCode(value || "")}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3 border-t border-slate-800/80 bg-slate-950/90 px-4 py-3">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            Run Code
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={submitCode}
            className="bg-blue-600 text-white hover:bg-blue-500"
          >
            Submit solution
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetCode}
          className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
        >
          Reset
        </Button>
      </CardFooter>
    </Card>
  );
}

