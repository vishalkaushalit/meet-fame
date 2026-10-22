import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { adminApi } from "../api/apiServices";
import { clearAuthToken, getAuthToken } from "../api/axiosInstance";
import Announcements from "../pages/Announcements";
import Availability from "../pages/Availability";
import Bookings from "../pages/Bookings";
import Analytics from "../pages/Analytics";
import HelpSupport from "../pages/HelpSupport";
import Approvals from "../pages/Approvals";
import Messages from "../pages/Messages";
import Payouts from "../pages/Payouts";
import Reviews from "../pages/Reviews";
import Settings from "../pages/Settings";

export const AdminSectionRoutes = ({
  overview,
  search,
  onSearchChange,
  bookings,
  bookingsLoading,
  bookingsError,
  onCreateBooking,
}) => {
  return (
    <Routes>
      <Route index element={overview} />
      <Route
        path="bookings"
        element={
          <Bookings
            search={search}
            onSearchChange={onSearchChange}
            bookings={bookings}
            loading={bookingsLoading}
            errorMessage={bookingsError}
            onCreateBooking={onCreateBooking}
          />
        }
      />
      <Route path="influencers" element={<Approvals />} />
      <Route path="messages" element={<Messages />} />
      <Route path="availability" element={<Availability />} />
      <Route path="announcements" element={<Announcements />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="payouts" element={<Payouts />} />
      <Route path="reviews" element={<Reviews />} />
      <Route path="settings" element={<Settings />} />
      <Route path="help-support" element={<HelpSupport />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      if (!getAuthToken()) {
        setStatus("unauthenticated");
        return;
      }

      try {
        await adminApi.auth.getMe();
        if (isMounted) {
          setStatus("authenticated");
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error.response?.status === 401) {
          clearAuthToken();
          setStatus("unauthenticated");
        } else {
          setStatus("error");
        }
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-sm text-slate-300">
        Checking admin session…
      </main>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (status === "error") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-center text-sm text-slate-300">
        <div>
          <p>
            Could not verify your admin session. Check your connection and try
            again.
          </p>
          <button
            className="mt-4 rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-500"
            onClick={() => window.location.reload()}
            type="button"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return children;
};

const AppRoutes = ({ loginPage, adminPage }) => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={loginPage} />
      <Route path="/admin/*" element={<AdminRoute>{adminPage}</AdminRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
