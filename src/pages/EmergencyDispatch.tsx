import { useState } from "react";
import {
  AlertTriangle,
  Car,
  Route,
  CloudRain,
  MapPin,
  Clock,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  Zap,
  Shield,
  Wind,
  Power,
  Sun,
} from "lucide-react";
import { useBusStore } from "@/stores/busStore";
import { routeColorClass, formatDate, todayStr } from "@/lib/utils";
import { uid } from "@/lib/utils";

type TabType = "outages" | "detours" | "closures" | "weather";

const weatherTypeMap: Record<string, { label: string; value: string }> = {
  rain: { label: "暴雨", value: "rain" },
  snow: { label: "大雪", value: "snow" },
  fog: { label: "大雾", value: "fog" },
  storm: { label: "大风", value: "storm" },
  heat: { label: "高温", value: "heat" },
};

const weatherLabel = (type: string) => weatherTypeMap[type]?.label || type;

const severityMap: Record<string, { label: string; value: string }> = {
  light: { label: "轻度", value: "light" },
  moderate: { label: "中度", value: "moderate" },
  severe: { label: "严重", value: "severe" },
};

export default function EmergencyDispatch() {
  const [activeTab, setActiveTab] = useState<TabType>("outages");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<string>("outage");
  const [formData, setFormData] = useState<Record<string, any>>({});

  const {
    routes,
    stops,
    vehicles,
    outages,
    detours,
    stopClosures,
    weatherDelays,
    addOutage,
    addDetour,
    toggleStopClosed,
    addWeatherDelay,
    addHistory,
  } = useBusStore();

  const tabs: { key: TabType; label: string; icon: typeof AlertTriangle; color: string }[] = [
    { key: "outages", label: "车辆停运", icon: Car, color: "crimson" },
    { key: "detours", label: "线路绕行", icon: Route, color: "amber" },
    { key: "closures", label: "站点封闭", icon: MapPin, color: "crimson" },
    { key: "weather", label: "天气延误", icon: CloudRain, color: "blue" },
  ];

  const openAddModal = (type: string) => {
    setModalType(type);
    setFormData({});
    setShowModal(true);
  };

  const handleAddOutage = () => {
    if (!formData.vehicleId || !formData.reason) return;
    const outage = {
      id: uid("outage_"),
      vehicleId: formData.vehicleId,
      reason: formData.reason,
      startDate: todayStr(),
      endDate: formData.endDate || "",
      isActive: true,
    };
    addOutage(outage);
    addHistory({
      type: "outage",
      entityType: "Outage",
      entityId: outage.id,
      action: "create",
      data: { vehicleId: formData.vehicleId, reason: formData.reason },
      operator: "调度员",
    });
    setShowModal(false);
    setFormData({});
  };

  const handleAddDetour = () => {
    if (!formData.routeId || !formData.reason) return;
    const tempId = uid("detour_");
    const detour = {
      routeId: formData.routeId,
      reason: formData.reason,
      skippedStopIds: formData.skippedStopIds || [],
      alternativeStopIds: formData.alternativeStopIds || [],
      addedMinutes: formData.addedMinutes || 5,
      startDate: todayStr(),
      endDate: formData.endDate || todayStr(),
    };
    addDetour(detour);
    addHistory({
      type: "detour",
      entityType: "Detour",
      entityId: tempId,
      action: "create",
      data: { routeId: formData.routeId, reason: formData.reason },
      operator: "调度员",
    });
    setShowModal(false);
    setFormData({});
  };

  const handleAddClosure = () => {
    if (!formData.stopId || !formData.reason) return;
    toggleStopClosed(formData.stopId, true, formData.reason, formData.alternativeStopId);
    addHistory({
      type: "closure",
      entityType: "Stop",
      entityId: formData.stopId,
      action: "closure",
      data: { reason: formData.reason, alternativeStopId: formData.alternativeStopId },
      operator: "调度员",
    });
    setShowModal(false);
    setFormData({});
  };

  const handleAddWeatherDelay = () => {
    if (!formData.weatherType || !formData.delayMinutes) return;
    const tempId = uid("weather_");
    const weather = {
      weatherType: formData.weatherType as any,
      reason: formData.reason || "",
      delayMinutes: Number(formData.delayMinutes),
      effectiveDate: todayStr(),
      severity: formData.severity || "moderate",
    };
    addWeatherDelay(weather);
    addHistory({
      type: "weather",
      entityType: "WeatherDelay",
      entityId: tempId,
      action: "weather_delay",
      data: { weatherType: formData.weatherType, delayMinutes: formData.delayMinutes },
      operator: "调度员",
    });
    setShowModal(false);
    setFormData({});
  };

  const activeOutages = outages.filter((o) => o.isActive);
  const activeDetours = detours.filter((d) => d.isActive);
  const activeClosures = stopClosures.filter((s) => s.isActive);
  const activeWeather = weatherDelays.filter((w) => w.isActive);

  const totalActive =
    activeOutages.length + activeDetours.length + activeClosures.length + activeWeather.length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl flex items-center gap-3">
            <Zap className="text-crimson-500" size={28} />
            应急调度中心
          </h1>
          <p className="text-ink-500 mt-1">
            紧急处理车辆停运、线路绕行、站点封闭和天气延误等突发事件
          </p>
        </div>
        {totalActive > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-crimson-50 dark:bg-crimson-900/20 border border-crimson-200 dark:border-crimson-800">
            <AlertTriangle size={20} className="text-crimson-500 animate-pulse" />
            <span className="text-crimson-700 dark:text-crimson-300 font-medium">
              {totalActive} 个活跃异常事件
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="metric-card glass-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-crimson-600">{activeOutages.length}</div>
              <div className="text-sm text-ink-500 mt-1">车辆停运</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-crimson-100 dark:bg-crimson-900/30 flex items-center justify-center">
              <Car className="text-crimson-500" size={24} />
            </div>
          </div>
        </div>
        <div className="metric-card glass-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-amber-600">{activeDetours.length}</div>
              <div className="text-sm text-ink-500 mt-1">线路绕行</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Route className="text-amber-500" size={24} />
            </div>
          </div>
        </div>
        <div className="metric-card glass-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-crimson-600">{activeClosures.length}</div>
              <div className="text-sm text-ink-500 mt-1">站点封闭</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-crimson-100 dark:bg-crimson-900/30 flex items-center justify-center">
              <MapPin className="text-crimson-500" size={24} />
            </div>
          </div>
        </div>
        <div className="metric-card glass-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-600">{activeWeather.length}</div>
              <div className="text-sm text-ink-500 mt-1">天气延误</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <CloudRain className="text-blue-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-1.5 inline-flex gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`nav-chip ${
                activeTab === tab.key
                  ? "bg-crimson-600 text-white shadow-glow"
                  : "text-ink-500 hover:bg-ink-100 dark:hover:bg-navy-800"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "outages" && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">车辆停运管理</h2>
            <button onClick={() => openAddModal("outage")} className="btn-primary text-sm">
              <Plus size={16} />
              新增停运
            </button>
          </div>

          {activeOutages.length === 0 ? (
            <div className="text-center py-12 text-ink-400">
              <CheckCircle2 size={48} className="mx-auto mb-3 text-jade-500 opacity-50" />
              <p>暂无停运车辆，所有车辆正常运营</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOutages.map((outage) => {
                const vehicle = vehicles.find((v) => v.id === outage.vehicleId);
                return (
                  <div
                    key={outage.id}
                    className="p-4 rounded-2xl border border-crimson-200 dark:border-crimson-800 bg-crimson-50 dark:bg-crimson-950/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-crimson-100 dark:bg-crimson-900/30 flex items-center justify-center">
                          <Car size={24} className="text-crimson-500" />
                        </div>
                        <div>
                          <div className="font-semibold">
                            {vehicle?.plateNumber || "未知车辆"} 停运
                          </div>
                          <div className="text-sm text-ink-500 mt-0.5">
                            原因：{outage.reason}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div className="text-ink-500">停运时间</div>
                          <div className="font-medium">
                            {outage.startDate}
                            {outage.endDate && ` ~ ${outage.endDate}`}
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-sm bg-crimson-100 text-crimson-700 dark:bg-crimson-900/30 dark:text-crimson-300">
                          停运中
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "detours" && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">线路绕行管理</h2>
            <button onClick={() => openAddModal("detour")} className="btn-primary text-sm">
              <Plus size={16} />
              新增绕行
            </button>
          </div>

          {activeDetours.length === 0 ? (
            <div className="text-center py-12 text-ink-400">
              <CheckCircle2 size={48} className="mx-auto mb-3 text-jade-500 opacity-50" />
              <p>暂无线路绕行，所有线路正常运行</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeDetours.map((detour) => {
                const route = routes.find((r) => r.id === detour.routeId);
                const skipStops = detour.skippedStopIds
                  .map((id) => stops.find((s) => s.id === id)?.name)
                  .filter(Boolean);
                return (
                  <div
                    key={detour.id}
                    className="p-5 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <Wind size={24} className="text-amber-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            {route && (
                              <span
                                className={`px-2 py-0.5 rounded text-sm font-bold ${routeColorClass(route.colorIndex)}`}
                              >
                                {route.code}
                              </span>
                            )}
                            <span className="font-semibold">{route?.name || "未知线路"} 绕行</span>
                          </div>
                          <div className="text-sm text-ink-500 mt-1">
                            原因：{detour.reason}
                          </div>
                          {skipStops.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className="text-xs text-ink-500">跳过站点：</span>
                              {skipStops.map((name, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-amber-600">
                          +{detour.addedMinutes}分钟
                        </div>
                        <div className="text-xs text-ink-500">预计延误</div>
                        <span className="mt-2 inline-block px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          绕行中
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "closures" && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">站点封闭管理</h2>
            <button onClick={() => openAddModal("closure")} className="btn-primary text-sm">
              <Plus size={16} />
              封闭站点
            </button>
          </div>

          {activeClosures.length === 0 ? (
            <div className="text-center py-12 text-ink-400">
              <CheckCircle2 size={48} className="mx-auto mb-3 text-jade-500 opacity-50" />
              <p>所有站点正常开放</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeClosures.map((closure) => {
                const stop = stops.find((s) => s.id === closure.stopId);
                const altStop = stops.find((s) => s.id === closure.alternativeStopId);
                return (
                  <div
                    key={closure.id}
                    className="p-4 rounded-2xl border border-crimson-200 dark:border-crimson-800 bg-crimson-50 dark:bg-crimson-950/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-crimson-100 dark:bg-crimson-900/30 flex items-center justify-center">
                          <MapPin size={24} className="text-crimson-500" />
                        </div>
                        <div>
                          <div className="font-semibold">
                            {stop?.name || "未知站点"} 已封闭
                          </div>
                          <div className="text-sm text-ink-500 mt-0.5">
                            原因：{closure.reason || "临时封闭"}
                          </div>
                          {altStop && (
                            <div className="text-sm text-blue-600 mt-1">
                              替代站点：{altStop.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm bg-crimson-100 text-crimson-700 dark:bg-crimson-900/30 dark:text-crimson-300">
                        已封闭
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "weather" && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">天气延误管理</h2>
            <button onClick={() => openAddModal("weather")} className="btn-primary text-sm">
              <Plus size={16} />
              发布天气预警
            </button>
          </div>

          {activeWeather.length === 0 ? (
            <div className="text-center py-12 text-ink-400">
              <Sun size={48} className="mx-auto mb-3 text-amber-500 opacity-50" />
              <p>天气正常，无延误</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeWeather.map((weather) => (
                <div
                  key={weather.id}
                  className="p-5 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <CloudRain size={28} className="text-blue-500" />
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{weatherLabel(weather.weatherType)}</div>
                        <div className="text-sm text-ink-500 mt-0.5">
                          {weather.reason}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">
                        +{weather.delayMinutes}分钟
                      </div>
                      <div className="text-sm text-ink-500">全站延误</div>
                      <span className="mt-2 inline-block px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        生效中
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">
                {modalType === "outage" && "新增车辆停运"}
                {modalType === "detour" && "新增线路绕行"}
                {modalType === "closure" && "封闭站点"}
                {modalType === "weather" && "发布天气预警"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-navy-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {modalType === "outage" && (
                <>
                  <div>
                    <label className="block text-sm text-ink-600 mb-1.5">选择车辆</label>
                    <select
                      value={formData.vehicleId || ""}
                      onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                      className="input-base w-full"
                    >
                      <option value="">请选择车辆</option>
                      {vehicles
                        .filter((v) => v.status === "normal")
                        .map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.plateNumber} - {v.model}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-ink-600 mb-1.5">停运原因</label>
                    <input
                      type="text"
                      value={formData.reason || ""}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="例：发动机故障维修"
                      className="input-base w-full"
                    />
                  </div>
                </>
              )}

              {modalType === "detour" && (
                <>
                  <div>
                    <label className="block text-sm text-ink-600 mb-1.5">选择线路</label>
                    <select
                      value={formData.routeId || ""}
                      onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                      className="input-base w-full"
                    >
                      <option value="">请选择线路</option>
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.code} - {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-ink-600 mb-1.5">绕行原因</label>
                    <input
                      type="text"
                      value={formData.reason || ""}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="例：道路施工绕行"
                      className="input-base w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-ink-600 mb-1.5">
                      额外延误时间（分钟）
                    </label>
                    <input
                      type="number"
                      value={formData.addedMinutes || 5}
                      onChange={(e) =>
                        setFormData({ ...formData, addedMinutes: e.target.value })
                      }
                      className="input-base w-full"
                    />
                  </div>
                </>
              )}

              {modalType === "closure" && (
                <>
                  <div>
                    <label className="block text-sm text-ink-600 mb-1.5">选择站点</label>
                    <select
                      value={formData.stopId || ""}
                      onChange={(e) => setFormData({ ...formData, stopId: e.target.value })}
                      className="input-base w-full"
                    >
                      <option value="">请选择站点</option>
                      {stops
                        .filter((s) => !s.isClosed)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-ink-600 mb-1.5">封闭原因</label>
                    <input
                      type="text"
                      value={formData.reason || ""}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="例：站点施工维护"
                      className="input-base w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-ink-600 mb-1.5">替代站点（可选）</label>
                    <select
                      value={formData.alternativeStopId || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, alternativeStopId: e.target.value })
                      }
                      className="input-base w-full"
                    >
                      <option value="">无</option>
                      {stops
                        .filter((s) => s.id !== formData.stopId)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              {modalType === "weather" && (
                <>
                  <div>
                    <label className="block text-sm text-ink-600 mb-1.5">天气类型</label>
                    <select
                      value={formData.weatherType || ""}
                      onChange={(e) => setFormData({ ...formData, weatherType: e.target.value })}
                      className="input-base w-full"
                    >
                      <option value="">请选择天气类型</option>
                      {Object.entries(weatherTypeMap).map(([key, val]) => (
                        <option key={key} value={key}>
                          {val.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-ink-600 mb-1.5">严重程度</label>
                    <select
                      value={formData.severity || "moderate"}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                      className="input-base w-full"
                    >
                      {Object.entries(severityMap).map(([key, val]) => (
                        <option key={key} value={key}>
                          {val.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-ink-600 mb-1.5">延误时间（分钟）</label>
                    <input
                      type="number"
                      value={formData.delayMinutes || 10}
                      onChange={(e) =>
                        setFormData({ ...formData, delayMinutes: e.target.value })
                      }
                      className="input-base w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-ink-600 mb-1.5">原因描述</label>
                    <textarea
                      value={formData.reason || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                      placeholder="简要描述天气情况..."
                      className="input-base w-full min-h-[80px]"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (modalType === "outage") handleAddOutage();
                  else if (modalType === "detour") handleAddDetour();
                  else if (modalType === "closure") handleAddClosure();
                  else if (modalType === "weather") handleAddWeatherDelay();
                }}
                className="btn-primary flex-1"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
