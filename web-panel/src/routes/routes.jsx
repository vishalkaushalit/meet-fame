import { Navigate, Route, Routes } from "react-router-dom";
import Bookings from "../pages/Bookings";
import Analytics from "../pages/Analytics";
import HelpSupport from "../pages/HelpSupport";
import Influencers from "../pages/Influencers";
import Messages from "../pages/Messages";
import Payouts from "../pages/Payouts";
import Reviews from "../pages/Reviews";
import Settings from "../pages/Settings";

function AppRoutes({ overview, search, onCreateBooking }) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/overview" replace />} />
      <Route path="/overview" element={overview} />
      <Route
        path="/bookings"
        element={
          <Bookings search={search} onCreateBooking={onCreateBooking} />
        }
      />
      <Route path="/influencers" element={<Influencers />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/payouts" element={<Payouts />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/help-support" element={<HelpSupport />} />
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}

export default AppRoutes;
