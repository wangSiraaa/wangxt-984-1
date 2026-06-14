import { useState, useMemo } from "react";
import {
  History,
  Filter,
  Search,
  Car,
  MapPin,
  Route,
  FileText,
  CloudRain,
  CreditCard,
  User,
  Wrench,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Eye,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  UserCheck,
} from "lucide-react";
import { useBusStore } from "@/stores/busStore";
import { useBusDerivation } from "@/hooks/useBusDerivation";
import { cn, routeColorClass } from "@/lib/utils";
import type { HistoryDerivationSnapshot, RouteInvisibilityReason } from "@/types";

type HistoryType = "all" | "vehicle" | "stop" | "route" | "rule" | "weather" | "swipe";
type PlaybackTab = "timeline" | "visibility";

const typeConfig: Record<HistoryType, { label: string; icon: typeof Car; color: string }> = {
  all: { label: "全部", icon: History, color: "ink" },
  vehicle: { label: "车辆", icon: Car, color: "navy" },
  stop: { label: "站点", icon: MapPin, color: "crimson" },
  route: { label: "线路", icon: Route, color: "amber" },
  rule: { label: "规则", icon: FileText, color: "purple" },
  weather: { label: "天气", icon: CloudRain, color: "blue" },
  swipe: { label: "刷卡", icon: CreditCard, color: "jade" },
};

const actionLabels: Record<string, string> = {
  create: "创建",
  update: "更新",
  delete: "删除",
  fault: "故障报修",
  replaced: "替换车调度",
  closure: "站点封闭",
  open: "站点开放",
  detour: "线路绕行",
  rule_change: "规则变更",
  weather_delay: "天气延误",
  swipe: "刷卡乘车",
  approve: "审批通过",
  reject: "审批拒绝",
  swipe_abnormal: "刷卡异常",
};

export default function HistoryPlayback() {
  const {
    history,
    resetAll,
    routes,
    stops,
    vehicles,
    students,
    drivers,
    detours,
    outages,
    stopClosures,
    weatherDelays,
    gradeRouteRules,
    tempStopRules,
    escortRules,
    parentAuths,
    leaveRecords,
    swipeRecords,
    teacherRollCalls,
    stopCapacities,
    driverSchedules,
    tempArrangements,
    swipeAbnormalRecords,
    derivationSnapshots,
    simulatedDate,
  } = useBusStore();

  const [activeTab, setActiveTab] = useState<PlaybackTab>("timeline");
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || "");
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [showLiveAnalysis, setShowLiveAnalysis] = useState(false);
  const [activeType, setActiveType] = useState<HistoryType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredHistory = useMemo(() => {
    let result = [...history];
    if (activeType !== "all") {
      result = result.filter((h) => h.type === activeType);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (h) =>
          h.operator.toLowerCase().includes(term) ||
          h.entityType.toLowerCase().includes(term) ||
          JSON.stringify(h.data).toLowerCase().includes(term)
      );
    }
    return result.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [history, activeType, searchTerm]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatFullDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "long",
    });
  };

  const getEntityName = (record: typeof history[0]) => {
    switch (record.entityType) {
      case "Vehicle":
        return vehicles.find((v) => v.id === record.entityId)?.plateNumber || record.entityId;
      case "Stop":
      case "StopClosure":
        return stops.find((s) => s.id === record.entityId)?.name || record.entityId;
      case "Route":
      case "Detour":
        return routes.find((r) => r.id === record.entityId)?.name || record.entityId;
      case "SwipeRecord":
        const studentId = (record.data as any)?.studentId;
        return students.find((s) => s.id === studentId)?.name || record.entityId;
      case "GradeRouteRule":
      case "TempStopRule":
      case "EscortRule":
        return "规则配置";
      case "WeatherDelay":
        return "天气预警";
      case "Outage":
        return "停运通知";
      default:
        return record.entityId;
    }
  };

  const typeConfigForRecord = (type: string) => {
    return typeConfig[type as HistoryType] || typeConfig.all;
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleReset = () => {
    if (window.confirm("确定要重置所有数据吗？这将恢复到初始演示状态。")) {
      resetAll();
    }
  };

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayRecords = history.filter(
      (h) => new Date(h.timestamp).toDateString() === today
    );
    return {
      total: history.length,
      today: todayRecords.length,
      vehicles: history.filter((h) => h.type === "vehicle").length,
      rules: history.filter((h) => h.type === "rule").length,
    };
  }, [history]);

  const schedules = useBusStore((s) => s.schedules);
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const { derivationResult } = useBusDerivation({
    student: selectedStudent,
    routes,
    stops,
    vehicles,
    drivers,
    schedules,
    detours,
    outages,
    stopClosures,
    weatherDelays,
    gradeRouteRules,
    tempStopRules,
    escortRules,
    parentAuths,
    leaveRecords,
    swipeRecords,
    teacherRollCalls,
    stopCapacities,
    driverSchedules,
    tempArrangements,
    swipeAbnormalRecords,
    simulatedDate,
  });

  const studentSnapshots = derivationSnapshots.filter((s) => s.studentId === selectedStudentId);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl flex items-center gap-3">
            <History className="text-purple-500" size={28} />
            历史回放
          </h1>
          <p className="text-ink-500 mt-1">
            查看系统操作历史记录，追溯所有调度和配置变更
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLiveAnalysis(!showLiveAnalysis)}
            className={cn(
              "btn-secondary",
              showLiveAnalysis && "ring-2 ring-purple-400"
            )}
          >
            <Eye size={16} />
            线路可见性分析
          </button>
          <button onClick={handleReset} className="btn-secondary">
            <RotateCcw size={16} />
            重置数据
          </button>
        </div>
      </div>

      <div className="glass-card p-1.5 inline-flex gap-1">
        <button
          onClick={() => setActiveTab("timeline")}
          className={cn(
            "nav-chip",
            activeTab === "timeline"
              ? "bg-purple-600 text-white shadow-glow"
              : "text-ink-500 hover:bg-ink-100 dark:hover:bg-navy-800"
          )}
        >
          <Clock size={16} />
          操作时间线
        </button>
        <button
          onClick={() => setActiveTab("visibility")}
          className={cn(
            "nav-chip",
            activeTab === "visibility"
              ? "bg-purple-600 text-white shadow-glow"
              : "text-ink-500 hover:bg-ink-100 dark:hover:bg-navy-800"
          )}
        >
          <Eye size={16} />
          线路可见性分析
        </button>
      </div>

      {activeTab === "visibility" && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User size={20} className="text-navy-500" />
                选择分析对象
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudentId(s.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    selectedStudentId === s.id
                      ? "border-purple-400 bg-purple-50 dark:bg-purple-950/30"
                      : "border-ink-200 dark:border-navy-700 hover:border-purple-300"
                  )}
                >
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-ink-500 mt-1">
                    {s.grade}年级 · {s.className}
                  </div>
                  <div className="text-xs text-ink-400 mt-0.5">
                    学号: {s.studentNo}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedStudent && derivationResult && (
            <>
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <UserCheck size={20} className="text-jade-500" />
                  可乘线路 ({derivationResult.availableRoutes.length})
                </h2>
                {derivationResult.availableRoutes.length === 0 ? (
                  <div className="text-center py-8 text-ink-400">
                    该学生当前无可乘线路
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {derivationResult.availableRoutes.map((r) => (
                      <div
                        key={r.scheduleId}
                        className="p-4 rounded-xl border border-jade-200 dark:border-jade-800 bg-jade-50/50 dark:bg-jade-950/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={cn("px-2 py-1 rounded text-xs font-medium", routeColorClass(r.colorIndex))}>
                              {r.routeCode}
                            </span>
                            <span className="font-medium">{r.routeName}</span>
                          </div>
                          <CheckCircle2 size={18} className="text-jade-500" />
                        </div>
                        <div className="mt-2 text-sm text-ink-600 dark:text-ink-300">
                          预计 {r.estimatedArrival} 到站 · 余座 {r.availableSeats}
                        </div>
                        {r.boardingHints && r.boardingHints.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {r.boardingHints.map((h) => (
                              <div
                                key={h.id}
                                className={cn(
                                  "text-xs px-2 py-1 rounded",
                                  h.type === "error" && "bg-crimson-100 text-crimson-700 dark:bg-crimson-950/30 dark:text-crimson-300",
                                  h.type === "warning" && "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
                                  h.type === "info" && "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
                                  h.type === "success" && "bg-jade-100 text-jade-700 dark:bg-jade-950/30 dark:text-jade-300"
                                )}
                              >
                                {h.message}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <XCircle size={20} className="text-crimson-500" />
                  不可乘线路 ({derivationResult.blockedRoutes.length})
                  <span className="text-sm font-normal text-ink-500 ml-2">
                    点击展开查看具体原因
                  </span>
                </h2>
                {derivationResult.blockedRoutes.length === 0 ? (
                  <div className="text-center py-8 text-ink-400">
                    所有线路对该学生均可见
                  </div>
                ) : (
                  <div className="space-y-2">
                    {derivationResult.blockedRoutes.map((r) => {
                      const isExpanded = expandedRouteId === r.scheduleId;
                      return (
                        <div
                          key={r.scheduleId}
                          className="rounded-xl border border-crimson-200 dark:border-crimson-800 overflow-hidden"
                        >
                          <button
                            onClick={() => setExpandedRouteId(isExpanded ? null : r.scheduleId)}
                            className="w-full p-4 flex items-center justify-between text-left hover:bg-crimson-50/50 dark:hover:bg-crimson-950/10"
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn("px-2 py-1 rounded text-xs font-medium", routeColorClass(r.colorIndex))}>
                                {r.routeCode}
                              </span>
                              <span className="font-medium">{r.routeName}</span>
                              <span className="text-sm text-ink-500">
                                ({r.estimatedArrival})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-crimson-600 dark:text-crimson-300">
                                {r.blockReasons.length} 项限制
                              </span>
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="p-4 pt-0 border-t border-crimson-100 dark:border-crimson-900 space-y-2">
                              {r.invisibilityReasons && r.invisibilityReasons.length > 0 ? (
                                r.invisibilityReasons.map((reason, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 rounded-lg bg-crimson-50 dark:bg-crimson-950/20"
                                  >
                                    <div className="flex items-center gap-2">
                                      <AlertTriangle size={14} className="text-crimson-500" />
                                      <span className="font-medium text-crimson-700 dark:text-crimson-300 text-sm">
                                        {reason.blockStep}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-sm text-ink-700 dark:text-ink-300">
                                      {reason.blockReason}
                                    </div>
                                    {reason.suggestion && (
                                      <div className="mt-1 text-xs text-jade-600 dark:text-jade-400 flex items-center gap-1">
                                        <Info size={12} />
                                        建议：{reason.suggestion}
                                      </div>
                                    )}
                                    {reason.blockData && (
                                      <details className="mt-2 text-xs text-ink-500">
                                        <summary className="cursor-pointer hover:text-ink-700">
                                          查看详细数据
                                        </summary>
                                        <pre className="mt-1 p-2 rounded bg-ink-100 dark:bg-navy-900/50 overflow-x-auto font-mono">
                                          {JSON.stringify(reason.blockData, null, 2)}
                                        </pre>
                                      </details>
                                    )}
                                  </div>
                                ))
                              ) : (
                                r.blockReasons.map((reason, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-crimson-50 dark:bg-crimson-950/20"
                                  >
                                    <AlertTriangle size={14} className="text-crimson-500 flex-shrink-0" />
                                    <span className="text-sm text-ink-700 dark:text-ink-300">{reason}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <FileText size={20} className="text-blue-500" />
                  推导步骤详情
                </h2>
                <div className="space-y-2">
                  {derivationResult.steps.map((step) => (
                    <div
                      key={step.id}
                      className={cn(
                        "p-3 rounded-lg border flex items-start gap-3",
                        step.passed
                          ? "border-jade-200 bg-jade-50/50 dark:border-jade-800 dark:bg-jade-950/10"
                          : "border-crimson-200 bg-crimson-50/50 dark:border-crimson-800 dark:bg-crimson-950/10"
                      )}
                    >
                      {step.passed ? (
                        <CheckCircle2 size={18} className="text-jade-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle size={18} className="text-crimson-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{step.name}</div>
                        <div className="text-xs text-ink-500 mt-0.5">{step.description}</div>
                        {step.reason && (
                          <div className={cn(
                            "text-xs mt-1",
                            step.passed ? "text-jade-600 dark:text-jade-400" : "text-crimson-600 dark:text-crimson-400"
                          )}>
                            {step.reason}
                          </div>
                        )}
                        {step.data && (
                          <details className="mt-2 text-xs text-ink-500">
                            <summary className="cursor-pointer hover:text-ink-700">
                              查看数据
                            </summary>
                            <pre className="mt-1 p-2 rounded bg-ink-100 dark:bg-navy-900/50 overflow-x-auto font-mono">
                              {JSON.stringify(step.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {studentSnapshots.length > 0 && (
                <div className="glass-card p-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <History size={20} className="text-amber-500" />
                    历史推导快照 ({studentSnapshots.length})
                  </h2>
                  <div className="space-y-2">
                    {studentSnapshots.slice(0, 10).map((snap) => (
                      <div
                        key={snap.id}
                        className="p-3 rounded-lg border border-ink-200 dark:border-navy-700"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-ink-600 dark:text-ink-300">
                            {formatFullDate(snap.timestamp)}
                          </span>
                          <span className="text-xs text-ink-500">
                            可乘 {snap.availableRoutes.length} 条 · 
                            阻塞 {snap.blockedRoutes.length} 条
                          </span>
                        </div>
                        {snap.blockedRoutes.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {snap.blockedRoutes.slice(0, 3).map((b) => (
                              <div key={b.routeId} className="text-xs text-crimson-600 dark:text-crimson-400">
                                {b.routeName}: {b.blockReason}
                              </div>
                            ))}
                            {snap.blockedRoutes.length > 3 && (
                              <div className="text-xs text-ink-500">
                                ...还有 {snap.blockedRoutes.length - 3} 条
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "timeline" && (
        <>
      <div className="grid grid-cols-4 gap-4">
        <div className="metric-card glass-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <History className="text-purple-500" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-ink-500">历史记录总数</div>
            </div>
          </div>
        </div>
        <div className="metric-card glass-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-jade-100 dark:bg-jade-900/30 flex items-center justify-center">
              <Clock className="text-jade-500" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.today}</div>
              <div className="text-xs text-ink-500">今日操作</div>
            </div>
          </div>
        </div>
        <div className="metric-card glass-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-navy-100 dark:bg-navy-900/30 flex items-center justify-center">
              <Wrench className="text-navy-500" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.vehicles}</div>
              <div className="text-xs text-ink-500">车辆相关</div>
            </div>
          </div>
        </div>
        <div className="metric-card glass-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Shield className="text-amber-500" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.rules}</div>
              <div className="text-xs text-ink-500">规则变更</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Play size={18} className="text-purple-500" />
            时间线回放控制器
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-500">播放速度：</span>
            {[0.5, 1, 2, 4].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                  playbackSpeed === speed
                    ? "bg-purple-600 text-white"
                    : "bg-ink-100 dark:bg-navy-800 text-ink-600 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-navy-700"
                )}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentIndex(0)}
            className="p-2 rounded-lg bg-ink-100 dark:bg-navy-800 hover:bg-ink-200 dark:hover:bg-navy-700"
          >
            <SkipBack size={18} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            onClick={() =>
              setCurrentIndex(Math.min(currentIndex + 1, filteredHistory.length - 1))
            }
            className="p-2 rounded-lg bg-ink-100 dark:bg-navy-800 hover:bg-ink-200 dark:hover:bg-navy-700"
          >
            <SkipForward size={18} />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-ink-500 mb-1">
              <span>{filteredHistory.length > 0 ? formatTime(filteredHistory[filteredHistory.length - 1].timestamp) : "--"}</span>
              <span>
                {filteredHistory.length > 0
                  ? `${currentIndex + 1} / ${filteredHistory.length}`
                  : "0 / 0"}
              </span>
              <span>{filteredHistory.length > 0 ? formatTime(filteredHistory[0].timestamp) : "--"}</span>
            </div>
            <div className="w-full h-2 bg-ink-200 dark:bg-navy-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{
                  width: `${
                    filteredHistory.length > 0
                      ? ((filteredHistory.length - 1 - currentIndex) / (filteredHistory.length - 1)) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="glass-card p-1.5 inline-flex gap-1 flex-1 overflow-x-auto">
          {Object.entries(typeConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveType(key as HistoryType);
                  setCurrentIndex(0);
                }}
                className={cn(
                  "nav-chip whitespace-nowrap",
                  activeType === key
                    ? "bg-purple-600 text-white shadow-glow"
                    : "text-ink-500 hover:bg-ink-100 dark:hover:bg-navy-800"
                )}
              >
                <Icon size={16} />
                {config.label}
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            type="text"
            placeholder="搜索历史记录..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentIndex(0);
            }}
            className="input-base pl-10 w-64"
          />
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock size={20} className="text-purple-500" />
            操作时间线
          </h2>
          <span className="text-sm text-ink-500">
            共 {filteredHistory.length} 条记录
          </span>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-16 text-ink-400">
            <History size={48} className="mx-auto mb-3 opacity-50" />
            <p>暂无历史记录</p>
            <p className="text-sm mt-1">进行操作后记录将显示在这里</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-purple-300 via-purple-200 to-transparent dark:from-purple-700 dark:via-purple-800" />

            <div className="space-y-4">
              {filteredHistory.map((record, index) => {
                const config = typeConfigForRecord(record.type);
                const Icon = config.icon;
                const isExpanded = expandedId === record.id;
                const entityName = getEntityName(record);
                const actionLabel = actionLabels[record.action] || record.action;

                return (
                  <div key={record.id} className="relative pl-12">
                    <div
                      className={cn(
                        "absolute left-0 top-2 w-10 h-10 rounded-xl flex items-center justify-center z-10 border-2 border-white dark:border-navy-950",
                        record.type === "vehicle" && "bg-navy-100 text-navy-600 dark:bg-navy-900 dark:text-navy-300",
                        record.type === "stop" && "bg-crimson-100 text-crimson-600 dark:bg-crimson-900 dark:text-crimson-300",
                        record.type === "route" && "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
                        record.type === "rule" && "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
                        record.type === "weather" && "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
                        record.type === "swipe" && "bg-jade-100 text-jade-600 dark:bg-jade-900 dark:text-jade-300"
                      )}
                    >
                      <Icon size={18} />
                    </div>

                    <div
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer",
                        isExpanded
                          ? "border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20"
                          : "border-ink-200 dark:border-navy-700 hover:border-purple-300 dark:hover:border-purple-700"
                      )}
                      onClick={() => toggleExpand(record.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{entityName}</span>
                            <span className="px-2 py-0.5 rounded text-xs bg-ink-100 dark:bg-navy-800 text-ink-600 dark:text-ink-400">
                              {actionLabel}
                            </span>
                            <span className="text-xs text-ink-400">
                              {record.entityType}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-ink-500">
                            <span className="flex items-center gap-1">
                              <User size={14} />
                              {record.operator}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {formatFullDate(record.timestamp)}
                            </span>
                          </div>
                        </div>
                        <button className="p-1 hover:bg-ink-100 dark:hover:bg-navy-800 rounded">
                          {isExpanded ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-ink-200 dark:border-navy-700">
                          <div className="text-sm text-ink-600 dark:text-ink-400">
                            <div className="font-medium mb-2">变更详情：</div>
                            <div className="bg-ink-50 dark:bg-navy-900/50 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(record.data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
