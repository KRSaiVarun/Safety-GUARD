import Navbar from "@/components/Navbar";
import { initSocket } from "@/lib/socket";
import { onAuthChange } from "@/lib/supabase";
import DashboardPage from "@/pages/DashboardPage";
import EmergencyPage from "@/pages/EmergencyPage";
import IncidentReplayPage from "@/pages/IncidentReplayPage";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import PasscodeSetupPage from "@/pages/PasscodeSetupPage";
import ProfilePage from "@/pages/ProfilePage";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function PasscodeProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, hasPasscode } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (!hasPasscode()) return <Navigate to="/passcode-setup" replace />;
  return <>{children}</>;
}

export default function App() {
  const { setUser } = useAuthStore();

  useEffect(() => {
    const {
      data: { subscription },
    } = onAuthChange(async (_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          name: session.user.user_metadata?.name ?? "User",
          phone: session.user.user_metadata?.phone ?? "",
          emergencyContacts:
            session.user.user_metadata?.emergencyContacts ?? [],
          createdAt: session.user.created_at,
        });
      } else {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [setUser]);

  useEffect(() => {
    // initialize socket.io client for live dashboard
    initSocket().catch((e) => console.warn("socket init failed", e));
  }, []);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/passcode-setup"
          element={
            <ProtectedRoute>
              <PasscodeSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PasscodeProtectedRoute>
              <DashboardPage />
            </PasscodeProtectedRoute>
          }
        />
        <Route
          path="/emergency"
          element={
            <PasscodeProtectedRoute>
              <EmergencyPage />
            </PasscodeProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PasscodeProtectedRoute>
              <ProfilePage />
            </PasscodeProtectedRoute>
          }
        />
        <Route
          path="/replay/:id"
          element={
            <PasscodeProtectedRoute>
              <IncidentReplayPage />
            </PasscodeProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
