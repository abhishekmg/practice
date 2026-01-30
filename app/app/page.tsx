import ChatInterface from "../components/ChatInterface";
import CodeEditor from "../components/CodeEditor";
import Sidebar from "../components/Sidebar";
import ResizablePanels from "../components/ResizablePanels";
import { AuthProvider } from "../contexts/AuthContext";
import { ApiKeyProvider } from "../contexts/ApiKeyContext";
import { CodeProvider } from "../contexts/CodeContext";
import { ProgressProvider } from "../contexts/ProgressContext";
import ProtectedRoute from "../components/ProtectedRoute";

// Force dynamic rendering since we use Supabase
export const dynamic = "force-dynamic";

export default function PracticeAppPage() {
  return (
    <AuthProvider>
      <ApiKeyProvider>
        <ProtectedRoute>
          <ProgressProvider>
            <CodeProvider>
              <main className="flex h-screen w-screen overflow-hidden bg-[#020617]">
                {/* Sidebar with roadmap/interview tabs */}
                <Sidebar />

                {/* Main content area with resizable panels */}
                <ResizablePanels
                  leftPanel={<ChatInterface />}
                  rightPanel={<CodeEditor />}
                  defaultLeftWidth={45}
                  minLeftWidth={25}
                  maxLeftWidth={70}
                />
              </main>
            </CodeProvider>
          </ProgressProvider>
        </ProtectedRoute>
      </ApiKeyProvider>
    </AuthProvider>
  );
}

