import ChatInterface from "./components/ChatInterface";
import CodeEditor from "./components/CodeEditor";
import { CodeProvider } from "./contexts/CodeContext";

export default function Home() {
  return (
    <CodeProvider>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] px-4 py-6 text-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
                AI Coding Studio
              </h1>
              <p className="text-sm text-zinc-400">
                Practice real-world interviews with an AI interviewer and
                in-browser code editor.
              </p>
            </div>
          </header>

          <section className="flex h-[calc(100vh-7.5rem)] min-h-0 gap-4">
            <div className="flex w-1/2 min-h-0 flex-col">
              <ChatInterface />
            </div>
            <div className="flex w-1/2 min-h-0 flex-col">
              <CodeEditor />
            </div>
          </section>
        </div>
      </main>
    </CodeProvider>
  );
}
