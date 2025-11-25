import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import Dashboard from "./pages/Dashboard";
import Snippets from "./pages/Snippets";
import SnippetDetail from "./pages/SnippetDetail";
import Notes from "./pages/Notes";
import Projects from "./pages/Projects";
import Tags from "./pages/Tags";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 p-6 bg-background">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/snippets" element={<ProtectedRoute><AppLayout><Snippets /></AppLayout></ProtectedRoute>} />
          <Route path="/snippets/:id" element={<ProtectedRoute><AppLayout><SnippetDetail /></AppLayout></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><AppLayout><Notes /></AppLayout></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><AppLayout><Projects /></AppLayout></ProtectedRoute>} />
          <Route path="/tags" element={<ProtectedRoute><AppLayout><Tags /></AppLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
);

export default App;
