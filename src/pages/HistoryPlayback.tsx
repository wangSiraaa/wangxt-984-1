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
} from "lucide-react";
import { useBusStore } from "@/stores/busStore";
import { cn } from "@/lib/utils";

type HistoryType = "all" | "vehicle" | "stop" | "route" | "rule" | "weather" | "swipe";

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
};

export default function HistoryPlayback() {
  const { history, resetAll, routes, stops, vehicles, students, drivers } = useBusStore();
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
        <button onClick={handleReset} className="btn-secondary">
          <RotateCcw size={16} />
          重置数据
        </button>
      </div>

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
    </div>
  );
}
