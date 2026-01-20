 'use client';

import Editor from "@monaco-editor/react";
import { useCode } from "../contexts/CodeContext";
import { Button } from "./ui/button";

export default function CodeEditor() {
  const { code, setCode, language, setLanguage, resetCode, submitCode } =
    useCode();

  return (
    <div className="flex h-full flex-col bg-slate-950">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-800/60 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Code Editor</h2>
          <p className="text-xs text-zinc-500">Write and refine your solution</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "javascript" | "python" | "java" | "cpp")}
            className="h-7 rounded border border-slate-700 bg-slate-900 px-2 text-xs text-zinc-100 outline-none transition focus:border-blue-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="min-h-0 flex-1">
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
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-slate-800/60 bg-slate-900/80 px-4 py-2">
        <div className="flex gap-2">
          <Button
            type="button"
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
            Submit
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetCode}
          className="border-slate-700 bg-slate-900 text-zinc-300 hover:bg-slate-800"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

