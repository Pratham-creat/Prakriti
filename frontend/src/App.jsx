import { useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FundReceived from "./pages/FundReceived";
import Expenditure from "./pages/Expenditure";
import Labour from "./pages/Labour";
import Attendance from "./pages/Attendance";
import Plantation from "./pages/Plantation";
import Maintenance from "./pages/Maintenance";
import Mortality from "./pages/Mortality";
import PlantOutward from "./pages/PlantOutward";
import PlantStock from "./pages/PlantStock";
import Reports from "./pages/Reports";

import Sidebar from "./components/Sidebar";

import { getToken, clearToken } from "./api";

export default function App() {
  const [token, setTokenState] = useState(getToken());
  const [page, setPage] = useState("Dashboard");

  function handleLogin() {
    setTokenState(getToken());
    setPage("Dashboard");
  }

  function handleLogout() {
    clearToken();
    setTokenState(null);
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  function renderPage() {
    switch (page) {
      case "Dashboard":
        return <Dashboard />;

      case "Fund Received":
        return <FundReceived />;

      case "Expenditure":
        return <Expenditure />;

      case "Labour Master":
        return <Labour />;

      case "Attendance":
        return <Attendance />;

      case "Plantation":
        return <Plantation />;

      case "Maintenance":
        return <Maintenance />;

      case "Mortality":
        return <Mortality />;

      case "Plant Outward":
        return <PlantOutward />;

      case "Plant Stock":
        return <PlantStock />;

      case "Reports":
        return <Reports />;

      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        active={page}
        onNavigate={setPage}
        onLogout={handleLogout}
      />

      <main className="flex-1 min-w-0 p-6">
        {renderPage()}
      </main>
    </div>
  );
}
