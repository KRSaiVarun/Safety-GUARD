import Navbar from "@/components/Navbar";
import { onAuthChange } from "@/lib/supabase";
import DashboardPage from "@/pages/DashboardPage";
import EmergencyPage from "@/pages/EmergencyPage";
import IncidentReplayPage from "@/pages/IncidentReplayPage";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import ProfilePage from "@/pages/ProfilePage";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
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

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emergency"
          element={
            <ProtectedRoute>
              <EmergencyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/replay/:id"
          element={
            <ProtectedRoute>
              <IncidentReplayPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
