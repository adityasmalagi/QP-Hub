import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { AccessibilityProvider } from "@/hooks/useAccessibility";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import Upload from "./pages/Upload";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PaperDetail from "./pages/PaperDetail";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import PublicProfile from "./pages/PublicProfile";
import MobileUpload from "./pages/MobileUpload";
import Requests from "./pages/Requests";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} themes={["light", "dark", "system"]} storageKey="qpaperhub-theme">
      <AccessibilityProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/paper/:id" element={<PaperDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/user/:userId" element={<PublicProfile />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/upload-mobile" element={<MobileUpload />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;