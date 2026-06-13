import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { Home, ArrowLeft, Bus, Sun, Moon } from "lucide-react";
import { useBusStore } from "@/stores/busStore";
import HomePage from "@/pages/Home";
import DispatcherDashboard from "@/pages/DispatcherDashboard";
import StopDisplay from "@/pages/StopDisplay";
import StudentView from "@/pages/StudentView";
import TeacherConfig from "@/pages/TeacherConfig";
import VehicleManager from "@/pages/VehicleManager";
import DriverVehicleDashboard from "@/pages/DriverVehicleDashboard";
import RouteSimulator from "@/pages/RouteSimulator";
import EmergencyDispatch from "@/pages/EmergencyDispatch";
import RuleExplanation from "@/pages/RuleExplanation";
import HistoryPlayback from "@/pages/HistoryPlayback";

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { darkMode, setDarkMode } = useBusStore();
  const isHome = location.pathname === "/";

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-ink-50 dark:bg-navy-950 text-ink-900 dark:text-ink-100 transition-colors duration-300">
        {!isHome && (
          <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-navy-950/80 border-b border-ink-200 dark:border-navy-800">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-navy-800 transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span className="text-sm font-medium">返回首页</span>
                </Link>
                <div className="h-6 w-px bg-ink-200 dark:bg-navy-700" />
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center">
                    <Bus size={16} className="text-white" />
                  </div>
                  <span className="font-display font-semibold text-lg">校园校车调度系统</span>
                </Link>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-navy-800 transition-colors"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </header>
        )}
        <main className={isHome ? "" : "max-w-7xl mx-auto px-6 py-8"}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dispatcher" element={<DispatcherDashboard />} />
          <Route path="/stop-display" element={<StopDisplay />} />
          <Route path="/student" element={<StudentView />} />
          <Route path="/teacher" element={<TeacherConfig />} />
          <Route path="/vehicle-manager" element={<VehicleManager />} />
          <Route path="/driver-dashboard" element={<DriverVehicleDashboard />} />
          <Route path="/simulator" element={<RouteSimulator />} />
          <Route path="/emergency" element={<EmergencyDispatch />} />
          <Route path="/rules" element={<RuleExplanation />} />
          <Route path="/history" element={<HistoryPlayback />} />
        </Routes>
      </Layout>
    </Router>
  );
}
