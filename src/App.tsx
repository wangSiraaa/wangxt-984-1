import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { Home, ArrowLeft, Bus, Sun, Moon, Calendar, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useBusStore } from "@/stores/busStore";
import { formatDateCN, isWeekend, todayStr } from "@/lib/utils";
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

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { darkMode, setDarkMode, simulatedDate, setSimulatedDate, resetSimulatedDate } = useBusStore();
  const isHome = location.pathname === "/";
  const isToday = simulatedDate === todayStr();
  const weekend = isWeekend(simulatedDate);

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-ink-50 dark:bg-navy-950 text-ink-900 dark:text-ink-100 transition-colors duration-300">
        {!isHome && (
          <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-navy-950/80 border-b border-ink-200 dark:border-navy-800">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-wrap">
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
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-ink-100 dark:bg-navy-800">
                  <button
                    onClick={() => setSimulatedDate(shiftDate(simulatedDate, -1))}
                    className="p-1.5 rounded hover:bg-ink-200 dark:hover:bg-navy-700 transition-colors"
                    title="前一天"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex items-center gap-2 px-2">
                    <Calendar size={16} className={weekend ? "text-crimson-500" : "text-navy-500"} />
                    <div className="flex flex-col leading-tight">
                      <span className="text-xs font-medium">
                        {isToday ? "今日运营" : "模拟日期"}
                        {weekend && !isToday && (
                          <span className="ml-1 text-crimson-500">周末</span>
                        )}
                        {weekend && isToday && (
                          <span className="ml-1 text-amber-500">今日周末</span>
                        )}
                      </span>
                      <span className="text-sm font-semibold">{formatDateCN(simulatedDate)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSimulatedDate(shiftDate(simulatedDate, 1))}
                    className="p-1.5 rounded hover:bg-ink-200 dark:hover:bg-navy-700 transition-colors"
                    title="后一天"
                  >
                    <ChevronRight size={16} />
                  </button>
                  {!isToday && (
                    <button
                      onClick={resetSimulatedDate}
                      className="ml-1 px-2 py-1 text-xs rounded-md bg-navy-600 text-white hover:bg-navy-700 transition-colors flex items-center gap-1"
                      title="回到今天"
                    >
                      <RotateCcw size={12} />
                      回到今天
                    </button>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSimulatedDate(shiftDate(todayStr(), -2))}
                    className="px-2 py-1 text-xs rounded-md bg-ink-100 dark:bg-navy-800 text-ink-600 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-navy-700 transition-colors"
                  >
                    周五
                  </button>
                  <button
                    onClick={() => setSimulatedDate(shiftDate(todayStr(), -1))}
                    className="px-2 py-1 text-xs rounded-md bg-ink-100 dark:bg-navy-800 text-ink-600 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-navy-700 transition-colors"
                  >
                    周六
                  </button>
                  <button
                    onClick={() => setSimulatedDate(todayStr())}
                    className="px-2 py-1 text-xs rounded-md bg-ink-100 dark:bg-navy-800 text-ink-600 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-navy-700 transition-colors"
                  >
                    今天
                  </button>
                  <button
                    onClick={() => setSimulatedDate(shiftDate(todayStr(), 1))}
                    className="px-2 py-1 text-xs rounded-md bg-ink-100 dark:bg-navy-800 text-ink-600 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-navy-700 transition-colors"
                  >
                    明天
                  </button>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-navy-800 transition-colors"
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
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
