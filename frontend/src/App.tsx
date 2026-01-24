import { Routes, Route, Navigate } from "react-router-dom";
import GuestChatView from "./pages/GuestChatView";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Routes>
      <Route path="/chat/:token" element={<GuestChatView />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;
