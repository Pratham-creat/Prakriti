import { useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FundReceived from "./pages/FundReceived";
import Expenditure from "./pages/Expenditure";
import Labour from "./pages/Labour";
import LabourPayments from "./pages/LabourPayments";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogin() {
    setTokenState(getToken());
    setPage("Dashboard");
    setMobileMenuOpen(false);
  }

  function handleLogout() {
    clearToken();
    setTokenState(null);
    setMobileMenuOpen(false);
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

      case "Labour Payments":
        return <LabourPayments />;

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
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main className="min-w-0 flex-1 p-4 pt-20 sm:p-6 sm:pt-6">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="fixed left-4 top-4 z-40 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 shadow-sm lg:hidden"
          aria-label="Open navigation"
        >
          ☰ Menu
        </button>
        {renderPage()}
      </main>
    </div>
  );
}
