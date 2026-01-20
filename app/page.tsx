import ChatInterface from "./components/ChatInterface";
import CodeEditor from "./components/CodeEditor";
import { CodeProvider } from "./contexts/CodeContext";

export default function Home() {
  return (
    <CodeProvider>
      <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#020617]">
        {/* Compact header */}
        {/* <header className="flex shrink-0 items-center justify-between border-b border-slate-800/60 bg-slate-950/80 px-4 py-2">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-zinc-50">
              AI Coding Studio
            </h1>
            <p className="text-xs text-zinc-500">
              Practice coding interviews with an AI interviewer
            </p>
          </div>
        </header> */}

        {/* Main split */}
        <section className="flex min-h-0 flex-1">
          <div className="flex min-h-0 w-1/2 flex-col border-r border-slate-800/60">
            <ChatInterface />
          </div>
          <div className="flex min-h-0 w-1/2 flex-col">
            <CodeEditor />
          </div>
        </section>
      </main>
    </CodeProvider>
  );
}
