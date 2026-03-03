import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Snippets = lazy(() => import("./pages/Snippets"));
const SnippetDetail = lazy(() => import("./pages/SnippetDetail"));
const Notes = lazy(() => import("./pages/Notes"));
const NoteEditorPage = lazy(() => import("./pages/NoteEditorPage"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectEditorPage = lazy(() => import("./pages/ProjectEditorPage"));
const Profile = lazy(() => import("./pages/Profile"));
const Tags = lazy(() => import("./pages/Tags"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
      Loading...
    </div>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 p-4 sm:p-6 bg-background">
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
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
                <Route path="/snippets" element={<ProtectedRoute><AppLayout><Snippets /></AppLayout></ProtectedRoute>} />
                <Route path="/snippets/:id" element={<ProtectedRoute><AppLayout><SnippetDetail /></AppLayout></ProtectedRoute>} />
                <Route path="/notes" element={<ProtectedRoute><AppLayout><Notes /></AppLayout></ProtectedRoute>} />
                <Route path="/notes/:id" element={<ProtectedRoute><AppLayout><NoteEditorPage /></AppLayout></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><AppLayout><Projects /></AppLayout></ProtectedRoute>} />
                <Route path="/projects/:id" element={<ProtectedRoute><AppLayout><ProjectEditorPage /></AppLayout></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
                <Route path="/tags" element={<ProtectedRoute><AppLayout><Tags /></AppLayout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
