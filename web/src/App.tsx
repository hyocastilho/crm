import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Contacts } from "./pages/Contacts";
import { Inbox } from "./pages/Inbox";
import { Login } from "./pages/Login";
import { Pipeline } from "./pages/Pipeline";
import { Settings } from "./pages/Settings";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Inbox />} />
        <Route path="/contatos" element={<Contacts />} />
        <Route path="/funil" element={<Pipeline />} />
        <Route path="/ajustes" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
