import { useState, useEffect } from "react";
import { MapPin, Clock, AlertTriangle, Users, Bus, ArrowRight, CloudRain } from "lucide-react";
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
    currentStopId,
    setCurrentStopId,
    simulatedDate,
  } = useBusStore();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    simulatedDate,
  });

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

        <div className="mt-6 flex gap-4">
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
        </div>

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
        <div className="grid grid-cols-7 gap-4 px-6 py-4 bg-ink-50 dark:bg-navy-900/50 border-b border-ink-200 dark:border-navy-700 text-sm font-medium text-ink-500">
          <div className="col-span-2">线路</div>
          <div>方向</div>
          <div className="text-center">预计到站</div>
          <div className="text-center">准点</div>
          <div className="text-center">余座</div>
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
              return (
                <div
                  key={`${arr.scheduleId}-${idx}`}
                  className={`grid grid-cols-7 gap-4 px-6 py-4 items-center transition-colors ${
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
                  <div className="text-sm text-ink-600 dark:text-ink-300">
                    {route?.direction === "up" ? "上行" : "下行"}
                    {arr.isTempStop && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                        临时停靠
                      </span>
                    )}
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
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
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
            {schedules.filter((s) => s.isActive && s.dayOfWeek.includes(new Date().getDay())).length}
          </div>
          <div className="mt-2 text-sm text-ink-500">
            已发车 {Math.floor(Math.random() * 5)} 班 · 待发车{" "}
            {schedules.filter((s) => s.isActive && s.dayOfWeek.includes(new Date().getDay())).length -
              Math.floor(Math.random() * 5)}{" "}
            班
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
              (stopClosure ? 1 : 0)}
          </div>
          <div className="mt-2 text-sm text-ink-500">
            {vehicles.filter((v) => v.status === "fault").length > 0 &&
              `${vehicles.filter((v) => v.status === "fault").length} 辆车故障 · `}
            {activeDetours.length > 0 && `${activeDetours.length} 条绕行 · `}
            {activeWeather && "天气延误"}
          </div>
        </div>
      </div>
    </div>
  );
}
