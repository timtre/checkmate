import { Routes, Route, Navigate } from "react-router-dom";
import GuestChatView from "./pages/GuestChatView";
import AdminPanel from "./pages/AdminPanel";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/chat/:token" element={<GuestChatView />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;
