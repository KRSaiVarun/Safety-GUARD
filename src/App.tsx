import Navbar from "@/components/Navbar";
import { getSession, onAuthChange } from "@/lib/supabase";
import DashboardPage from "@/pages/DashboardPage";
import EmergencyPage from "@/pages/EmergencyPage";
import IncidentReplayPage from "@/pages/IncidentReplayPage";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import UserHomePage from "@/pages/UserHomePage";
import PasscodeSetupPage from "@/pages/PasscodeSetupPage";
import ProfilePage from "@/pages/ProfilePage";
import EmergencyHistoryPage from "@/pages/EmergencyHistoryPage";
import ContactsPage from "@/pages/ContactsPage";
import SettingsPage from "@/pages/SettingsPage";
import AdminHomePage from "@/pages/admin/AdminHomePage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminAnalyticsPage from "@/pages/admin/AdminAnalyticsPage";
import AdminLiveTrackingPage from "@/pages/admin/AdminLiveTrackingPage";
import AdminSessionsPage from "@/pages/admin/AdminSessionsPage";
import AdminAIPage from "@/pages/admin/AdminAIPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { User, UserRole } from "@/types";

function mapSupabaseUser(u: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
  created_at: string;
}): User {
  const emailLower = (u.email ?? "").toLowerCase();
  return {
    id: u.id,
    email: u.email ?? "",
    name: (u.user_metadata?.name as string) ?? "User",
    phone: (u.user_metadata?.phone as string) ?? "",
    role: emailLower === "kr@gmail.com"
      ? "admin"
      : ((u.user_metadata?.role as UserRole) ?? "user"),
    emergencyContacts: (u.user_metadata?.emergencyContacts as User["emergencyContacts"]) ?? [],
    createdAt: u.created_at,
  };
}

// ── Route guards ──────────────────────────────────────────────────────────────

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

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, hasPasscode, isAdmin } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  if (!hasPasscode()) return <Navigate to="/passcode-setup" replace />;
  return <>{children}</>;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { setUser, setPasscodeHash } = useAuthStore();

  useEffect(() => {
    getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(mapSupabaseUser(data.session.user));
        const metaHash = data.session.user.user_metadata?.passcodeHash as string | undefined;
        if (metaHash) setPasscodeHash(metaHash);
      }
    });

    const { data: { subscription } } = onAuthChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        const metaHash = session.user.user_metadata?.passcodeHash as string | undefined;
        if (metaHash) setPasscodeHash(metaHash);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setPasscodeHash]);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Passcode setup — both users and admins */}
        <Route
          path="/passcode-setup"
          element={
            <ProtectedRoute>
              <PasscodeSetupPage />
            </ProtectedRoute>
          }
        />

        {/* ── User routes ────────────────────────────────────────────── */}
        <Route
          path="/dashboard"
          element={
            <PasscodeProtectedRoute>
              <UserHomePage />
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
          path="/history"
          element={
            <PasscodeProtectedRoute>
              <EmergencyHistoryPage />
            </PasscodeProtectedRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <PasscodeProtectedRoute>
              <ContactsPage />
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
          path="/settings"
          element={
            <PasscodeProtectedRoute>
              <SettingsPage />
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

        {/* ── Admin routes ───────────────────────────────────────────── */}
        <Route
          path="/admin/home"
          element={
            <AdminRoute>
              <AdminHomePage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <DashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <AdminAnalyticsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/live"
          element={
            <AdminRoute>
              <AdminLiveTrackingPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/sessions"
          element={
            <AdminRoute>
              <AdminSessionsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/ai"
          element={
            <AdminRoute>
              <AdminAIPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminSettingsPage />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
