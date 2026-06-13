import { useState } from "react";
import {
  Route,
  Bus,
  MapPin,
  User,
  Calendar,
  AlertTriangle,
  Wrench,
  CloudRain,
  Plus,
  RefreshCw,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { useBusStore } from "@/stores/busStore";
import { routeColorClass, statusLabel, daysUntil, gradeLabel } from "@/lib/utils";
import { useBusDerivation } from "@/hooks/useBusDerivation";

type TabType = "routes" | "stops" | "vehicles" | "drivers" | "schedules" | "outages" | "detours" | "weather";

export default function DispatcherDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("routes");
  const {
    routes,
    stops,
    vehicles,
    drivers,
    schedules,
    detours,
    outages,
    stopClosures,
    weatherDelays,
    updateVehicleStatus,
    toggleStopClosed,
    addOutage,
    addDetour,
    addWeatherDelay,
    resetAll,
    addHistory,
    assignReplacementVehicle,
  } = useBusStore();

  const { stopArrivals } = useBusDerivation({
    student: undefined,
    routes,
    stops,
    vehicles,
    schedules,
    drivers,
    detours,
    outages,
    stopClosures,
    weatherDelays,
    gradeRouteRules: [],
    tempStopRules: [],
    escortRules: [],
    parentAuths: [],
    leaveRecords: [],
    swipeRecords: [],
  });

  const tabs: { key: TabType; label: string; icon: typeof Route }[] = [
    { key: "routes", label: "线路管理", icon: Route },
    { key: "stops", label: "站点管理", icon: MapPin },
    { key: "vehicles", label: "车辆管理", icon: Bus },
    { key: "drivers", label: "司机管理", icon: User },
    { key: "schedules", label: "班次管理", icon: Calendar },
    { key: "outages", label: "停运管理", icon: Ban },
    { key: "detours", label: "绕行管理", icon: RefreshCw },
    { key: "weather", label: "天气延误", icon: CloudRain },
  ];

  const handleVehicleFault = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;
    updateVehicleStatus(vehicleId, "fault", "发动机故障");
    addHistory({
      type: "vehicle",
      entityType: "Vehicle",
      entityId: vehicleId,
      action: "fault",
      data: { plateNumber: vehicle.plateNumber, reason: "发动机故障" },
      operator: "调度员",
    });
    const spareVehicle = vehicles.find(
      (v) => v.status === "normal" && !v.routeId && v.id !== vehicleId
    );
    if (spareVehicle) {
      assignReplacementVehicle(vehicleId, spareVehicle.id);
      addHistory({
        type: "vehicle",
        entityType: "Vehicle",
        entityId: spareVehicle.id,
        action: "replaced",
        data: { replacedVehicle: vehicleId, plateNumber: spareVehicle.plateNumber },
        operator: "调度员",
      });
    }
  };

  const handleToggleStop = (stopId: string) => {
    const stop = stops.find((s) => s.id === stopId);
    if (!stop) return;
    const newClosed = !stop.isClosed;
    const altStop = stops.find((s) => s.id !== stopId && !s.isClosed);
    toggleStopClosed(stopId, newClosed, newClosed ? "临时维护" : undefined, newClosed && altStop ? altStop.id : undefined);
    addHistory({
      type: "stop",
      entityType: "StopClosure",
      entityId: stopId,
      action: "closure",
      data: { stopId, stopName: stop.name, closed: newClosed, alternative: altStop?.name },
      operator: "调度员",
    });
  };

  const stats = [
    { label: "在线线路", value: routes.filter((r) => r.isActive).length, total: routes.length, color: "navy" },
    { label: "运营站点", value: stops.filter((s) => !s.isClosed).length, total: stops.length, color: "jade" },
    { label: "正常车辆", value: vehicles.filter((v) => v.status === "normal" || v.status === "replacement").length, total: vehicles.length, color: "amber" },
    { label: "今日班次", value: schedules.filter((s) => s.isActive && s.dayOfWeek.includes(new Date().getDay())).length, total: schedules.length, color: "crimson" },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">调度中心</h1>
          <p className="text-ink-500 mt-1">线路、站点、车辆、班次的统一调度管理</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              resetAll();
            }}
            className="btn-secondary"
          >
            <RefreshCw size={18} />
            重置数据
          </button>
          <button className="btn-primary">
            <Plus size={18} />
            新增调度
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="metric-card glass-card">
            <div className="text-ink-500 text-sm mb-1">{stat.label}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{stat.value}</span>
              <span className="text-ink-400 text-sm">/ {stat.total}</span>
            </div>
            <div className={`mt-2 h-1.5 rounded-full bg-${stat.color}-200 dark:bg-${stat.color}-900`}>
              <div
                className={`h-full rounded-full ${routeColorClass(1).includes("navy") ? "bg-navy-500" : ""} ${stat.color === "jade" ? "bg-jade-500" : ""} ${stat.color === "amber" ? "bg-amber-500" : ""} ${stat.color === "crimson" ? "bg-crimson-500" : ""}`}
                style={{ width: `${(stat.value / stat.total) * 100}%` }}
              />
            </div>
          </div>
        ))}
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
                  ? "bg-navy-600 text-white shadow-glow"
                  : "text-ink-500 hover:bg-ink-100 dark:hover:bg-navy-800"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="glass-card p-6">
        {activeTab === "routes" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">线路列表</h2>
            <div className="grid gap-4">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-ink-200 dark:border-navy-700 hover:border-navy-300 dark:hover:border-navy-600 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1.5 rounded-lg font-medium ${routeColorClass(route.colorIndex)}`}>
                      {route.code}
                    </div>
                    <div>
                      <div className="font-medium">{route.name}</div>
                      <div className="text-sm text-ink-500">{route.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-sm">
                      <span className="text-ink-500">站点数：</span>
                      <span className="font-medium">{route.stops.length}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-ink-500">方向：</span>
                      <span className="font-medium">{route.direction === "up" ? "上行" : "下行"}</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        route.isActive
                          ? "bg-jade-100 text-jade-700 dark:bg-jade-950/50 dark:text-jade-300"
                          : "bg-ink-100 text-ink-500 dark:bg-navy-800 dark:text-ink-400"
                      }`}
                    >
                      {route.isActive ? "运营中" : "已停用"}
                    </span>
                    <div className="flex gap-2">
                      <button className="btn-ghost text-sm">
                        <MapPin size={16} />
                        查看站点
                      </button>
                      <button className="btn-ghost text-sm">
                        <Wrench size={16} />
                        编辑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "stops" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">站点列表</h2>
            <div className="grid grid-cols-2 gap-4">
              {stops.map((stop) => (
                <div
                  key={stop.id}
                  className={`p-4 rounded-xl border transition-all ${
                    stop.isClosed
                      ? "border-crimson-300 bg-crimson-50 dark:bg-crimson-950/20 dark:border-crimson-800"
                      : "border-ink-200 dark:border-navy-700 hover:border-navy-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin size={18} className={stop.isClosed ? "text-crimson-500" : "text-navy-500"} />
                        <span className="font-medium">{stop.name}</span>
                        {stop.isClosed && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-crimson-100 text-crimson-700 dark:bg-crimson-900/50 dark:text-crimson-300">
                            已封闭
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-ink-500 mt-1">{stop.location}</div>
                      <div className="text-xs text-ink-400 mt-1">
                        容量：{stop.capacity}人
                        {stop.closedReason && ` · ${stop.closedReason}`}
                        {stop.alternativeStopId &&
                          ` · 换乘：${stops.find((s) => s.id === stop.alternativeStopId)?.name}`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleStop(stop.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        stop.isClosed
                          ? "bg-jade-100 text-jade-700 hover:bg-jade-200 dark:bg-jade-950/50 dark:text-jade-300"
                          : "bg-crimson-100 text-crimson-700 hover:bg-crimson-200 dark:bg-crimson-950/50 dark:text-crimson-300"
                      }`}
                    >
                      {stop.isClosed ? "恢复开放" : "临时封闭"}
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-ink-200 dark:border-navy-700">
                    <div className="text-xs text-ink-500 mb-1">实时到站信息</div>
                    <div className="space-y-1">
                      {stopArrivals
                        .filter((a) => a.stopId === stop.id && a.isShowing)
                        .slice(0, 3)
                        .map((arr) => (
                          <div key={arr.scheduleId} className="flex items-center justify-between text-sm">
                            <span className={`px-2 py-0.5 rounded text-xs ${routeColorClass(arr.colorIndex)}`}>
                              {arr.routeCode}
                            </span>
                            <span className="font-mono">{arr.estimatedArrival}</span>
                            {arr.delayMinutes > 0 && (
                              <span className="text-amber-600 text-xs">+{arr.delayMinutes}分</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "vehicles" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">车辆列表</h2>
            <div className="grid gap-4">
              {vehicles.map((vehicle) => {
                const inspectionDays = daysUntil(vehicle.inspectionExpiryDate);
                const s = statusLabel(vehicle.status);
                return (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-ink-200 dark:border-navy-700 hover:border-navy-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-navy-100 dark:bg-navy-800 flex items-center justify-center">
                        <Bus size={24} className="text-navy-600 dark:text-navy-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{vehicle.plateNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
                            {s.label}
                          </span>
                          {vehicle.replacementVehicleId && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-navy-100 text-navy-700 dark:bg-navy-800 dark:text-navy-200">
                              替换车：{vehicles.find((v) => v.id === vehicle.replacementVehicleId)?.plateNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-ink-500">
                          {vehicle.model} · 核载{vehicle.capacity}人
                          {vehicle.routeId && ` · 线路：${routes.find((r) => r.id === vehicle.routeId)?.name}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-sm">
                        <div className="text-ink-500">当前载客</div>
                        <div className="font-medium">
                          {vehicle.currentLoad} / {vehicle.capacity}人
                          <span className="ml-2 text-xs text-ink-400">
                            {Math.round((vehicle.currentLoad / vehicle.capacity) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-ink-500">年检到期</div>
                        <div className={`font-medium ${inspectionDays <= 7 ? "text-crimson-600" : ""}`}>
                          {vehicle.inspectionExpiryDate}
                          <span className="ml-2 text-xs">
                            {inspectionDays > 0 ? `剩余${inspectionDays}天` : "已过期"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {vehicle.status === "normal" && (
                          <button onClick={() => handleVehicleFault(vehicle.id)} className="btn-ghost text-sm text-crimson-600">
                            <Wrench size={16} />
                            标记故障
                          </button>
                        )}
                        <button className="btn-ghost text-sm">
                          <CheckCircle2 size={16} />
                          详情
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "drivers" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">司机列表</h2>
            <div className="grid grid-cols-2 gap-4">
              {drivers.map((driver) => {
                const licenseDays = daysUntil(driver.licenseExpiryDate);
                const driverSchedules = schedules.filter((s) => s.driverId === driver.id);
                return (
                  <div
                    key={driver.id}
                    className="p-4 rounded-xl border border-ink-200 dark:border-navy-700 hover:border-navy-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center">
                          <User size={20} className="text-navy-600 dark:text-navy-300" />
                        </div>
                        <div>
                          <div className="font-medium">{driver.name}</div>
                          <div className="text-sm text-ink-500">工号：{driver.employeeNo}</div>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          driver.status === "on_duty"
                            ? "bg-jade-100 text-jade-700 dark:bg-jade-950/50 dark:text-jade-300"
                            : driver.status === "leave"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                            : "bg-ink-100 text-ink-500 dark:bg-navy-800 dark:text-ink-400"
                        }`}
                      >
                        {driver.status === "on_duty" ? "在岗" : driver.status === "leave" ? "休假" : "休班"}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-ink-200 dark:border-navy-700 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-ink-500">驾驶证有效期：</span>
                        <span className={licenseDays <= 30 ? "text-crimson-600" : ""}>
                          {driver.licenseExpiryDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-ink-500">联系电话：</span>
                        <span>{driver.phone}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-ink-500">今日班次：</span>
                        <span className="ml-2">
                          {driverSchedules.filter((s) => s.dayOfWeek.includes(new Date().getDay())).length} 班
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "schedules" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">班次列表</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-200 dark:border-navy-700">
                    <th className="text-left py-3 px-2 font-medium text-ink-500">班次号</th>
                    <th className="text-left py-3 px-2 font-medium text-ink-500">线路</th>
                    <th className="text-left py-3 px-2 font-medium text-ink-500">发车时间</th>
                    <th className="text-left py-3 px-2 font-medium text-ink-500">车辆</th>
                    <th className="text-left py-3 px-2 font-medium text-ink-500">司机</th>
                    <th className="text-left py-3 px-2 font-medium text-ink-500">运营日</th>
                    <th className="text-left py-3 px-2 font-medium text-ink-500">状态</th>
                    <th className="text-left py-3 px-2 font-medium text-ink-500">备注</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((sch) => {
                    const route = routes.find((r) => r.id === sch.routeId);
                    const vehicle = vehicles.find((v) => v.id === sch.vehicleId);
                    const driver = drivers.find((d) => d.id === sch.driverId);
                    const outage = outages.find(
                      (o) =>
                        o.isActive &&
                        (o.scheduleId === sch.id || o.vehicleId === sch.vehicleId || o.routeId === sch.routeId)
                    );
                    return (
                      <tr
                        key={sch.id}
                        className="border-b border-ink-100 dark:border-navy-800 hover:bg-ink-50 dark:hover:bg-navy-900/50"
                      >
                        <td className="py-3 px-2 font-mono">{sch.id}</td>
                        <td className="py-3 px-2">
                          {route && (
                            <span className={`px-2 py-0.5 rounded text-xs ${routeColorClass(route.colorIndex)}`}>
                              {route.code}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 font-mono font-medium">{sch.departureTime}</td>
                        <td className="py-3 px-2">{vehicle?.plateNumber}</td>
                        <td className="py-3 px-2">{driver?.name}</td>
                        <td className="py-3 px-2">
                          {sch.dayOfWeek
                            .map((d) => ["日", "一", "二", "三", "四", "五", "六"][d])
                            .join("、")}
                        </td>
                        <td className="py-3 px-2">
                          {outage ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-crimson-100 text-crimson-700 dark:bg-crimson-950/50 dark:text-crimson-300">
                              停运
                            </span>
                          ) : sch.isActive ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-jade-100 text-jade-700 dark:bg-jade-950/50 dark:text-jade--300">
                              运营中
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-ink-100 text-ink-500 dark:bg-navy-800 dark:text-ink-400">
                              停用
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-ink-500 text-xs">{sch.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "outages" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">停运管理</h2>
              <button
                onClick={() => {
                  addOutage({
                    routeId: routes[0].id,
                    startDate: new Date().toISOString().slice(0, 10),
                    endDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
                    reason: "线路临时维护",
                  });
                }}
                className="btn-primary text-sm"
              >
                <Plus size={16} />
                新增停运
              </button>
            </div>
            <div className="space-y-3">
              {outages.length === 0 ? (
                <div className="text-center py-12 text-ink-400">
                  <Ban size={48} className="mx-auto mb-3 opacity-50" />
                  <p>暂无停运记录</p>
                </div>
              ) : (
                outages.map((outage) => (
                  <div
                    key={outage.id}
                    className={`p-4 rounded-xl border ${
                      outage.isActive
                        ? "border-crimson-300 bg-crimson-50 dark:bg-crimson-950/20 dark:border-crimson-800"
                        : "border-ink-200 dark:border-navy-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle
                          size={24}
                          className={outage.isActive ? "text-crimson-500" : "text-ink-400"}
                        />
                        <div>
                          <div className="font-medium">{outage.reason}</div>
                          <div className="text-sm text-ink-500">
                            {outage.routeId && `线路：${routes.find((r) => r.id === outage.routeId)?.name} · `}
                            {outage.vehicleId && `车辆：${vehicles.find((v) => v.id === outage.vehicleId)?.plateNumber} · `}
                            {outage.scheduleId && `班次：${outage.scheduleId}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          {outage.startDate} ~ {outage.endDate}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            outage.isActive
                              ? "bg-crimson-100 text-crimson-700 dark:bg-crimson-900/50 dark:text-crimson-300"
                              : "bg-ink-100 text-ink-500 dark:bg-navy-800 dark:text-ink-400"
                          }`}
                        >
                          {outage.isActive ? "生效中" : "已结束"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "detours" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">绕行管理</h2>
              <button
                onClick={() => {
                  addDetour({
                    routeId: routes[0].id,
                    skippedStopIds: [stops[0].id],
                    alternativeStopIds: [stops[1].id],
                    startDate: new Date().toISOString().slice(0, 10),
                    endDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
                    reason: "临时交通管制",
                    addedMinutes: 5,
                  });
                }}
                className="btn-primary text-sm"
              >
                <Plus size={16} />
                新增绕行
              </button>
            </div>
            <div className="space-y-3">
              {detours.length === 0 ? (
                <div className="text-center py-12 text-ink-400">
                  <RefreshCw size={48} className="mx-auto mb-3 opacity-50" />
                  <p>暂无绕行记录</p>
                </div>
              ) : (
                detours.map((detour) => (
                  <div
                    key={detour.id}
                    className={`p-4 rounded-xl border ${
                      detour.isActive
                        ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"
                        : "border-ink-200 dark:border-navy-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <RefreshCw
                          size={24}
                          className={detour.isActive ? "text-amber-500" : "text-ink-400"}
                        />
                        <div>
                          <div className="font-medium">
                            {routes.find((r) => r.id === detour.routeId)?.name} - {detour.reason}
                          </div>
                          <div className="text-sm text-ink-500">
                            跳过：
                            {detour.skippedStopIds
                              .map((id) => stops.find((s) => s.id === id)?.name)
                              .join("、")}
                            {" · "}
                            改经：
                            {detour.alternativeStopIds
                              .map((id) => stops.find((s) => s.id === id)?.name)
                              .join("、")}
                            {" · "}
                            增加{detour.addedMinutes}分钟
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          {detour.startDate} ~ {detour.endDate}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            detour.isActive
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                              : "bg-ink-100 text-ink-500 dark:bg-navy-800 dark:text-ink-400"
                          }`}
                        >
                          {detour.isActive ? "生效中" : "已结束"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "weather" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">天气延误</h2>
              <button
                onClick={() => {
                  addWeatherDelay({
                    delayMinutes: 10,
                    reason: "暴雨天气，路面湿滑",
                    effectiveDate: new Date().toISOString().slice(0, 10),
                    weatherType: "storm",
                    severity: "severe",
                  });
                }}
                className="btn-primary text-sm"
              >
                <Plus size={16} />
                发布天气延误
              </button>
            </div>
            <div className="space-y-3">
              {weatherDelays.length === 0 ? (
                <div className="text-center py-12 text-ink-400">
                  <CloudRain size={48} className="mx-auto mb-3 opacity-50" />
                  <p>暂无天气延误</p>
                </div>
              ) : (
                weatherDelays.map((wd) => (
                  <div
                    key={wd.id}
                    className={`p-4 rounded-xl border ${
                      wd.isActive
                        ? "border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800"
                        : "border-ink-200 dark:border-navy-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CloudRain
                          size={24}
                          className={wd.isActive ? "text-blue-500" : "text-ink-400"}
                        />
                        <div>
                          <div className="font-medium">{wd.reason}</div>
                          <div className="text-sm text-ink-500">
                            {wd.weatherType === "rain" && "降雨"}
                            {wd.weatherType === "snow" && "降雪"}
                            {wd.weatherType === "fog" && "大雾"}
                            {wd.weatherType === "storm" && "暴雨"}
                            {wd.weatherType === "heat" && "高温"}
                            {" · "}
                            {wd.severity === "light" && "轻度"}
                            {wd.severity === "moderate" && "中度"}
                            {wd.severity === "severe" && "严重"}
                            {" · "}
                            延误{wd.delayMinutes}分钟
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{wd.effectiveDate}</div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            wd.isActive
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                              : "bg-ink-100 text-ink-500 dark:bg-navy-800 dark:text-ink-400"
                          }`}
                        >
                          {wd.isActive ? "生效中" : "已结束"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

