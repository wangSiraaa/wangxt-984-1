import { useState, useEffect } from "react";
import { MapPin, Clock, AlertTriangle, Users, Bus, ArrowRight, CloudRain, Wrench, UserCheck, ShieldAlert, Zap, Car, RefreshCw } from "lucide-react";
import { useBusStore } from "@/stores/busStore";
import { useBusDerivation } from "@/hooks/useBusDerivation";
import { routeColorClass, routeBarClass, weatherLabel } from "@/lib/utils";

export default function StopDisplay() {
  const {
    routes,
    stops,
    vehicles,
    schedules,
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
    currentStopId,
    setCurrentStopId,
    simulatedDate,
    updateStopCapacity,
    addWeatherDelay,
    addDetour,
    addOutage,
    updateVehicleStatus,
    assignReplacementVehicle,
    updateDriverSchedule,
    addHistory,
  } = useBusStore();

  const [showQuickActions, setShowQuickActions] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { stopArrivals, derivationResult } = useBusDerivation({
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

  const effectiveDate = simulatedDate || new Date().toISOString().split("T")[0];
  const dayOfWeek = new Date(simulatedDate || new Date()).getDay();

  const handleQuickWeatherDelay = () => {
    const delayMinutes = prompt("请输入延误分钟数：", "15");
    if (delayMinutes && !isNaN(Number(delayMinutes))) {
      addWeatherDelay({
        weatherType: "rain",
        delayMinutes: Number(delayMinutes),
        reason: "紧急天气延误",
        effectiveDate: effectiveDate,
        severity: "moderate",
      });
      addHistory({
        type: "weather",
        entityType: "WeatherDelay",
        entityId: "WD_QUICK",
        action: "weather_delay",
        data: { delayMinutes: Number(delayMinutes), reason: "紧急天气延误" },
        operator: "调度员",
      });
    }
  };

  const handleQuickVehicleFault = () => {
    const availableVehicles = vehicles.filter((v) => v.status === "normal");
    if (availableVehicles.length === 0) {
      alert("没有正常运营的车辆");
      return;
    }
    const vehicleId = prompt(`请输入故障车辆ID（可用：${availableVehicles.map((v) => `${v.id}(${v.plateNumber})`).join("、")}）：`, availableVehicles[0].id);
    if (vehicleId) {
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) {
        alert("车辆不存在");
        return;
      }
      updateVehicleStatus(vehicleId, "fault", "紧急车辆故障");
      addOutage({
        vehicleId,
        reason: "车辆故障",
        startDate: effectiveDate,
        endDate: effectiveDate,
      });
      addHistory({
        type: "vehicle",
        entityType: "Vehicle",
        entityId: vehicleId,
        action: "fault",
        data: { plateNumber: vehicle.plateNumber, reason: "紧急车辆故障" },
        operator: "调度员",
      });
    }
  };

  const handleQuickDetour = () => {
    const activeRoutes = routes.filter((r) => r.isActive);
    if (activeRoutes.length === 0) return;
    const routeId = prompt(`请输入绕行线路ID（可用：${activeRoutes.map((r) => `${r.id}(${r.name})`).join("、")}）：`, activeRoutes[0].id);
    if (routeId) {
      const route = routes.find((r) => r.id === routeId);
      if (route && route.stops.length > 2) {
        addDetour({
          routeId,
          reason: "紧急绕行",
          skippedStopIds: [route.stops[1].stopId],
          alternativeStopIds: [],
          addedMinutes: 10,
          startDate: effectiveDate,
          endDate: effectiveDate,
        });
        addHistory({
          type: "route",
          entityType: "Detour",
          entityId: routeId,
          action: "detour",
          data: { routeName: route.name, skippedStopIds: [route.stops[1].stopId] },
          operator: "调度员",
        });
      }
    }
  };

  const handleReplaceVehicle = () => {
    const faultyVehicles = vehicles.filter((v) => v.status === "fault");
    const replacementVehicles = vehicles.filter((v) => v.status === "normal" || v.status === "replacement");
    if (faultyVehicles.length === 0) {
      alert("没有故障车辆，请先标记车辆故障");
      return;
    }
    if (replacementVehicles.length === 0) {
      alert("没有可用替换车辆");
      return;
    }
    const faultyVehicleId = prompt(`请输入故障车辆ID（故障车：${faultyVehicles.map((v) => `${v.id}(${v.plateNumber})`).join("、")}）：`, faultyVehicles[0].id);
    if (faultyVehicleId) {
      const newVehicleId = prompt(`请输入替换车辆ID（可用：${replacementVehicles.map((v) => `${v.id}(${v.plateNumber})`).join("、")}）：`, replacementVehicles[0].id);
      if (newVehicleId) {
        assignReplacementVehicle(faultyVehicleId, newVehicleId);
        const todaysSchedules = schedules.filter((s) => s.vehicleId === faultyVehicleId && s.dayOfWeek.includes(dayOfWeek));
        todaysSchedules.forEach((s) => {
          updateDriverSchedule(s.driverId, s.id, "replaced", undefined, `车辆${faultyVehicleId}故障，替换为${newVehicleId}`);
        });
        addHistory({
          type: "vehicle",
          entityType: "Vehicle",
          entityId: faultyVehicleId,
          action: "replaced",
          data: { faultyVehicleId, replacementVehicleId: newVehicleId },
          operator: "调度员",
        });
        alert(`替换成功：${newVehicleId} 将接管 ${faultyVehicleId} 的所有班次`);
      }
    }
  };

  const currentStop = stops.find((s) => s.id === currentStopId);
  const activeWeather = weatherDelays.find((w) => w.isActive);
  const stopClosure = stopClosures.find((c) => c.stopId === currentStopId && c.isActive);
  const activeDetours = detours.filter((d) => d.isActive && d.skippedStopIds.includes(currentStopId));

  const arrivalsForStop = stopArrivals
    .filter((a) => a.stopId === currentStopId)
    .slice(0, 8);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/5 to-transparent dark:from-navy-800/20" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-navy-600 flex items-center justify-center shadow-glow">
                <MapPin size={28} className="text-white" />
              </div>
              <div>
                <h1 className="section-title text-3xl">{currentStop?.name}</h1>
                <p className="text-ink-500 mt-1">
                  {currentStop?.location} · 容量 {currentStop?.capacity} 人
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-mono font-bold tracking-wider text-navy-600 dark:text-navy-300">
              {formatTime(currentTime)}
            </div>
            <div className="text-ink-500 mt-1">
              {currentTime.toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4 items-center">
          <div className="flex-1 h-2 rounded-full bg-ink-100 dark:bg-navy-800 overflow-hidden">
            {routes.map((route) => {
              const routeArrivals = arrivalsForStop.filter((a) => a.routeId === route.id && a.isShowing);
              if (routeArrivals.length === 0) return null;
              const width = (routeArrivals.length / Math.max(arrivalsForStop.filter((a) => a.isShowing).length, 1)) * 100;
              return (
                <div
                  key={route.id}
                  className={`h-full ${routeBarClass(route.colorIndex)} float-right`}
                  style={{ width: `${width}%` }}
                />
              );
            })}
          </div>
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              showQuickActions
                ? "bg-navy-600 text-white"
                : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-navy-800 dark:text-ink-300"
            }`}
          >
            <Zap size={16} />
            应急调度
          </button>
        </div>

        {showQuickActions && (
          <div className="mt-4 p-4 rounded-xl bg-navy-50 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-700">
            <div className="text-sm font-medium text-navy-700 dark:text-navy-300 mb-3">快速发布调度指令</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={handleQuickWeatherDelay}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-navy-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border border-ink-200 dark:border-navy-700"
              >
                <CloudRain size={24} className="text-blue-500" />
                <span className="text-sm font-medium text-ink-700 dark:text-ink-300">天气延误</span>
              </button>
              <button
                onClick={handleQuickVehicleFault}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-navy-800 hover:bg-crimson-50 dark:hover:bg-crimson-900/30 transition-colors border border-ink-200 dark:border-navy-700"
              >
                <Wrench size={24} className="text-crimson-500" />
                <span className="text-sm font-medium text-ink-700 dark:text-ink-300">车辆故障</span>
              </button>
              <button
                onClick={handleQuickDetour}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-navy-800 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors border border-ink-200 dark:border-navy-700"
              >
                <ArrowRight size={24} className="text-amber-500" />
                <span className="text-sm font-medium text-ink-700 dark:text-ink-300">紧急绕行</span>
              </button>
              <button
                onClick={handleReplaceVehicle}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-navy-800 hover:bg-jade-50 dark:hover:bg-jade-900/30 transition-colors border border-ink-200 dark:border-navy-700"
              >
                <RefreshCw size={24} className="text-jade-500" />
                <span className="text-sm font-medium text-ink-700 dark:text-ink-300">替换车辆</span>
              </button>
            </div>
          </div>
        )}

        {derivationResult?.systemState && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {derivationResult.systemState.weatherDelays > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <CloudRain size={16} className="text-blue-500" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {derivationResult.systemState.weatherDelays} 条天气延误
                </span>
              </div>
            )}
            {derivationResult.systemState.activeDetours > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <ArrowRight size={16} className="text-amber-500" />
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  {derivationResult.systemState.activeDetours} 条线路绕行
                </span>
              </div>
            )}
            {derivationResult.systemState.activeOutages > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-crimson-50 dark:bg-crimson-950/30 border border-crimson-200 dark:border-crimson-800">
                <AlertTriangle size={16} className="text-crimson-500" />
                <span className="text-sm text-crimson-700 dark:text-crimson-300">
                  {derivationResult.systemState.activeOutages} 个班次停运
                </span>
              </div>
            )}
            {derivationResult.systemState.stopClosures > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                <ShieldAlert size={16} className="text-purple-500" />
                <span className="text-sm text-purple-700 dark:text-purple-300">
                  {derivationResult.systemState.stopClosures} 个站点封闭
                </span>
              </div>
            )}
          </div>
        )}

        {(activeWeather || stopClosure || activeDetours.length > 0) && (
          <div className="mt-4 space-y-2">
            {activeWeather && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <CloudRain size={20} className="text-blue-500" />
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">
                    {weatherLabel(activeWeather.weatherType).label}预警：
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {activeWeather.reason}，预计延误 {activeWeather.delayMinutes} 分钟
                  </span>
                </div>
              </div>
            )}
            {stopClosure && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-crimson-50 dark:bg-crimson-950/30 border border-crimson-200 dark:border-crimson-800">
                <AlertTriangle size={20} className="text-crimson-500" />
                <div>
                  <span className="font-medium text-crimson-700 dark:text-crimson-300">站点临时封闭：</span>
                  <span className="text-crimson-600 dark:text-crimson-400">
                    {stopClosure.reason}
                    {stopClosure.alternativeStopId && (
                      <span>
                        {" · "}请前往{" "}
                        <span className="font-semibold">
                          {stops.find((s) => s.id === stopClosure.alternativeStopId)?.name}
                        </span>{" "}
                        乘车
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
            {activeDetours.map((detour) => (
              <div
                key={detour.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
              >
                <ArrowRight size={20} className="text-amber-500" />
                <div>
                  <span className="font-medium text-amber-700 dark:text-amber-300">
                    {routes.find((r) => r.id === detour.routeId)?.name} 临时绕行：
                  </span>
                  <span className="text-amber-600 dark:text-amber-400">
                    {detour.reason}，增加 {detour.addedMinutes} 分钟
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
          {stops.map((stop) => (
            <button
              key={stop.id}
              onClick={() => setCurrentStopId(stop.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                stop.id === currentStopId
                  ? "bg-navy-600 text-white shadow-glow"
                  : stop.isClosed
                  ? "bg-crimson-50 text-crimson-600 dark:bg-crimson-950/30"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-navy-800 dark:text-ink-300 dark:hover:bg-navy-700"
              }`}
            >
              <MapPin size={14} />
              {stop.name}
              {stop.isClosed && <span className="text-xs">(已封闭)</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-10 gap-3 px-6 py-4 bg-ink-50 dark:bg-navy-900/50 border-b border-ink-200 dark:border-navy-700 text-sm font-medium text-ink-500">
          <div className="col-span-2">线路</div>
          <div className="text-center">预计到站</div>
          <div className="text-center">准点</div>
          <div className="text-center">余座</div>
          <div className="text-center">站点候车</div>
          <div className="text-center">点名</div>
          <div className="text-center">司机</div>
          <div className="text-center">核验</div>
          <div className="text-center">状态</div>
        </div>

        <div className="divide-y divide-ink-100 dark:divide-navy-800">
          {arrivalsForStop.length === 0 ? (
            <div className="py-16 text-center text-ink-400">
              <Bus size={48} className="mx-auto mb-3 opacity-50" />
              <p>暂无到站信息</p>
            </div>
          ) : (
            arrivalsForStop.map((arr, idx) => {
              const route = routes.find((r) => r.id === arr.routeId);
              const driver = drivers.find((d) => d.id === schedules.find((s) => s.id === arr.scheduleId)?.driverId);
              return (
                <div key={`${arr.scheduleId}-${idx}`}>
                  <div
                    className={`grid grid-cols-10 gap-3 px-6 py-4 items-center transition-colors ${
                      !arr.isShowing
                        ? "opacity-50 bg-ink-50/50 dark:bg-navy-900/30"
                        : idx === 0
                        ? "bg-navy-50/50 dark:bg-navy-900/30 animate-pulse-slow"
                        : "hover:bg-ink-50 dark:hover:bg-navy-900/20"
                    }`}
                  >
                    <div className="col-span-2 flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-lg font-medium ${routeColorClass(arr.colorIndex)}`}>
                        {arr.routeCode}
                      </div>
                      <div>
                        <div className="font-medium">{arr.routeName}</div>
                        <div className="text-xs text-ink-500">{arr.vehiclePlate}</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-mono font-bold tracking-wide">
                        {arr.isShowing ? arr.estimatedArrival : "--:--"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono text-sm text-ink-500">{arr.originalArrival}</div>
                      {arr.delayMinutes > 0 && (
                        <div className="text-amber-600 text-sm font-medium">+{arr.delayMinutes}分</div>
                      )}
                      {arr.delayMinutes < 0 && (
                        <div className="text-jade-600 text-sm font-medium">{arr.delayMinutes}分</div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users size={14} className="text-ink-400" />
                        <span
                          className={`font-medium ${
                            arr.availableSeats === 0
                              ? "text-crimson-600"
                              : arr.availableSeats <= 5
                              ? "text-amber-600"
                              : "text-jade-600"
                          }`}
                        >
                          {arr.availableSeats}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users size={14} className="text-ink-400" />
                        <span
                          className={`font-medium ${
                            arr.stopMaxCapacity && arr.stopCurrentCount !== undefined && arr.stopCurrentCount >= arr.stopMaxCapacity
                              ? "text-crimson-600"
                              : arr.stopMaxCapacity && arr.stopCurrentCount !== undefined && arr.stopCurrentCount >= arr.stopMaxCapacity * 0.8
                              ? "text-amber-600"
                              : "text-jade-600"
                          }`}
                        >
                          {arr.stopCurrentCount !== undefined ? arr.stopCurrentCount : "-"}
                          {arr.stopMaxCapacity !== undefined && `/${arr.stopMaxCapacity}`}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <UserCheck size={14} className="text-jade-500" />
                        <span className="text-sm font-medium text-ink-600 dark:text-ink-300">
                          {arr.rollCallPresent}
                          <span className="text-ink-400">/{arr.rollCallAbsent + arr.rollCallPresent || 0}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          arr.driverStatus === "on_duty"
                            ? "bg-jade-100 text-jade-700 dark:bg-jade-950/50 dark:text-jade-300"
                            : arr.driverStatus === "scheduled"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                            : arr.driverStatus === "replaced"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                            : "bg-crimson-100 text-crimson-700 dark:bg-crimson-950/50 dark:text-crimson-300"
                        }`}
                      >
                        {arr.driverStatus === "on_duty"
                          ? "在岗"
                          : arr.driverStatus === "scheduled"
                          ? "排班"
                          : arr.driverStatus === "replaced"
                          ? "代班"
                          : arr.driverStatus === "leave"
                          ? "请假"
                          : "离岗"}
                      </span>
                    </div>
                    <div className="text-center">
                      {(() => {
                        const hints = arr.boardingHints || [];
                        const hasError = hints.some((h) => h.type === "error");
                        const hasWarning = hints.some((h) => h.type === "warning");
                        const hasInfo = hints.some((h) => h.type === "info");
                        if (hasError) {
                          return (
                            <span className="px-2 py-1 rounded-full text-xs bg-crimson-100 text-crimson-700 dark:bg-crimson-950/50 dark:text-crimson-300">
                              <AlertTriangle size={12} className="inline mr-1" />
                              异常
                            </span>
                          );
                        }
                        if (hasWarning) {
                          return (
                            <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                              <AlertTriangle size={12} className="inline mr-1" />
                              注意
                            </span>
                          );
                        }
                        if (hasInfo) {
                          return (
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                              <Clock size={12} className="inline mr-1" />
                              提示
                            </span>
                          );
                        }
                        return (
                          <span className="px-2 py-1 rounded-full text-xs bg-jade-100 text-jade-700 dark:bg-jade-950/50 dark:text-jade-300">
                            <UserCheck size={12} className="inline mr-1" />
                            正常
                          </span>
                        );
                      })()}
                    </div>
                    <div className="text-center">
                      {!arr.isShowing ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-ink-100 text-ink-500 dark:bg-navy-800 dark:text-ink-400">
                          {arr.hideReason}
                        </span>
                      ) : arr.isClosed ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-crimson-100 text-crimson-700 dark:bg-crimson-950/50 dark:text-crimson-300">
                          站点封闭
                        </span>
                      ) : arr.availableSeats === 0 ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                          满员
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-jade-100 text-jade-700 dark:bg-jade-950/50 dark:text-jade-300">
                          可乘车
                        </span>
                      )}
                    </div>
                  </div>
                  {arr.transferHint && (
                    <div className="px-6 pb-3">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-sm">
                        <ArrowRight size={14} />
                        {arr.transferHint}
                      </div>
                    </div>
                  )}
                  {arr.boardingHints && arr.boardingHints.length > 0 && (
                    <div className="px-6 pb-3 space-y-1">
                      {arr.boardingHints.map((hint) => (
                        <div
                          key={hint.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                            hint.type === "error"
                              ? "bg-crimson-50 dark:bg-crimson-950/30 text-crimson-700 dark:text-crimson-300"
                              : hint.type === "warning"
                              ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300"
                              : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          {hint.type === "error" ? (
                            <AlertTriangle size={14} />
                          ) : hint.type === "warning" ? (
                            <AlertTriangle size={14} />
                          ) : (
                            <Clock size={14} />
                          )}
                          {hint.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-ink-500 mb-3">
            <Bus size={16} />
            <span className="text-sm">运营车辆</span>
          </div>
          <div className="text-3xl font-bold">
            {vehicles.filter((v) => v.status === "normal" || v.status === "replacement").length}
            <span className="text-lg text-ink-400 font-normal"> / {vehicles.length}</span>
          </div>
          <div className="mt-2 flex gap-1">
            {vehicles.slice(0, 8).map((v) => (
              <div
                key={v.id}
                className={`w-3 h-3 rounded-full ${
                  v.status === "normal"
                    ? "bg-jade-500"
                    : v.status === "replacement"
                    ? "bg-navy-500"
                    : v.status === "full"
                    ? "bg-amber-500"
                    : v.status === "fault"
                    ? "bg-crimson-500"
                    : "bg-ink-300"
                }`}
                title={v.plateNumber}
              />
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-ink-500 mb-3">
            <Clock size={16} />
            <span className="text-sm">今日班次</span>
          </div>
          <div className="text-3xl font-bold">
            {schedules.filter((s) => s.isActive && s.dayOfWeek.includes(dayOfWeek)).length}
          </div>
          <div className="mt-2 text-sm text-ink-500">
            在岗司机 {driverSchedules.filter((d) => d.date === effectiveDate && (d.status === "on_duty" || d.status === "scheduled")).length} 人
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-ink-500 mb-3">
            <UserCheck size={16} />
            <span className="text-sm">老师点名</span>
          </div>
          <div className="text-3xl font-bold text-jade-600">
            {teacherRollCalls.filter((r) => r.date === effectiveDate && r.status === "present").length}
            <span className="text-lg text-ink-400 font-normal"> 已到</span>
          </div>
          <div className="mt-2 text-sm text-ink-500">
            未到 {teacherRollCalls.filter((r) => r.date === effectiveDate && r.status === "absent").length} 人 · 
            请假 {teacherRollCalls.filter((r) => r.date === effectiveDate && r.status === "leave").length} 人
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-ink-500 mb-3">
            <AlertTriangle size={16} />
            <span className="text-sm">异常提醒</span>
          </div>
          <div className="text-3xl font-bold text-crimson-600">
            {vehicles.filter((v) => v.status === "fault").length +
              activeDetours.length +
              (activeWeather ? 1 : 0) +
              (stopClosure ? 1 : 0) +
              swipeAbnormalRecords.filter((r) => !r.handled).length}
          </div>
          <div className="mt-2 text-sm text-ink-500">
            {swipeAbnormalRecords.filter((r) => !r.handled).length > 0 &&
              `${swipeAbnormalRecords.filter((r) => !r.handled).length} 条刷卡异常 · `}
            {vehicles.filter((v) => v.status === "fault").length > 0 &&
              `${vehicles.filter((v) => v.status === "fault").length} 辆车故障 · `}
            {activeDetours.length > 0 && `${activeDetours.length} 条绕行`}
          </div>
        </div>
      </div>
    </div>
  );
}
