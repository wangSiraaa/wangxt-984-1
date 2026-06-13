import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Bus,
  MapPin,
  Clock,
  Map,
  Zap,
  Sun,
  CloudRain,
  Wind,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useBusStore } from "@/stores/busStore";
import { addMinutes, routeColorClass, formatTime } from "@/lib/utils";

const weatherLabelMap: Record<string, string> = {
  rain: "暴雨",
  snow: "大雪",
  fog: "大雾",
  storm: "大风",
  heat: "高温",
};

export default function RouteSimulator() {
  const { routes, stops, vehicles, detours, weatherDelays, stopClosures } = useBusStore();
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0]?.id || "");
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || "");
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulatedTime, setSimulatedTime] = useState("07:00");
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [speed, setSpeed] = useState(1);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId);
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const routeStops = selectedRoute?.stops || [];
  const activeDetour = detours.find(
    (d) => d.routeId === selectedRouteId && d.isActive
  );
  const activeWeather = weatherDelays.find((w) => w.isActive);
  const activeClosures = stopClosures.filter((s) => s.isActive);

  const getStopStatus = (stopId: string, index: number) => {
    if (index < currentStopIndex) return "passed";
    if (index === currentStopIndex) return "current";
    return "upcoming";
  };

  const getEstimatedArrival = (stopIndex: number) => {
    if (!selectedRoute) return "";
    const baseTime = "07:00";
    const stop = selectedRoute.stops[stopIndex];
    if (!stop) return "";

    let totalMinutes = stop.estimatedMinutes;
    if (activeWeather) {
      totalMinutes += activeWeather.delayMinutes;
    }
    if (activeDetour) {
      totalMinutes += activeDetour.addedMinutes;
    }

    return addMinutes(baseTime, totalMinutes);
  };

  useEffect(() => {
    if (!isPlaying || !selectedRoute) return;

    const interval = setInterval(() => {
      setCurrentStopIndex((prev) => {
        if (prev >= routeStops.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000 / speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed, routeStops.length, selectedRoute]);

  const resetSimulation = () => {
    setCurrentStopIndex(0);
    setIsPlaying(false);
    setSimulatedTime("07:00");
  };

  const nextStop = () => {
    if (currentStopIndex < routeStops.length - 1) {
      setCurrentStopIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl flex items-center gap-3">
            <Map className="text-teal-500" size={28} />
            线路模拟器
          </h1>
          <p className="text-ink-500 mt-1">
            模拟车辆运行状态，预测各站点到站时间，验证绕行和天气影响
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-4">
          <div className="glass-card p-5">
            <h2 className="font-semibold mb-4">选择线路</h2>
            <div className="space-y-2">
              {routes.map((route) => (
                <button
                  key={route.id}
                  onClick={() => {
                    setSelectedRouteId(route.id);
                    resetSimulation();
                  }}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    route.id === selectedRouteId
                      ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-600"
                      : "bg-ink-50 dark:bg-navy-900/30 border-2 border-transparent hover:bg-ink-100 dark:hover:bg-navy-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded text-sm font-bold ${routeColorClass(route.colorIndex)}`}
                    >
                      {route.code}
                    </span>
                    <div>
                      <div className="font-medium">{route.name}</div>
                      <div className="text-xs text-ink-500">
                        {route.stops.length} 站 · {route.direction === "up" ? "上行" : "下行"}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h2 className="font-semibold mb-4">选择车辆</h2>
            <div className="space-y-2">
              {vehicles.slice(0, 4).map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    vehicle.id === selectedVehicleId
                      ? "bg-green-50 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-600"
                      : "bg-ink-50 dark:bg-navy-900/30 border-2 border-transparent hover:bg-ink-100 dark:hover:bg-navy-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Bus
                      size={20}
                      className={
                        vehicle.status === "fault"
                          ? "text-crimson-500"
                          : vehicle.status === "full"
                          ? "text-amber-500"
                          : "text-green-500"
                      }
                    />
                    <div>
                      <div className="font-medium">{vehicle.plateNumber}</div>
                      <div className="text-xs text-ink-500">
                        {vehicle.currentLoad}/{vehicle.capacity}人 · {vehicle.model}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h2 className="font-semibold mb-4">模拟控制</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-ink-500 mb-2">模拟时间</div>
                <div className="text-3xl font-mono font-bold text-center py-3 bg-ink-50 dark:bg-navy-900/50 rounded-xl">
                  {formatTime(new Date(`2024-01-01T${simulatedTime}`))}
                </div>
              </div>

              <div>
                <div className="text-sm text-ink-500 mb-2">播放速度</div>
                <div className="flex gap-2">
                  {[0.5, 1, 2, 4].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                        speed === s
                          ? "bg-blue-600 text-white"
                          : "bg-ink-100 text-ink-600 dark:bg-navy-800 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-navy-700"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
                    isPlaying
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "bg-teal-500 text-white hover:bg-teal-600"
                  }`}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  {isPlaying ? "暂停" : "播放"}
                </button>
                <button
                  onClick={nextStop}
                  className="p-3 rounded-xl bg-ink-100 dark:bg-navy-800 hover:bg-ink-200 dark:hover:bg-navy-700"
                >
                  <SkipForward size={18} />
                </button>
                <button
                  onClick={resetSimulation}
                  className="p-3 rounded-xl bg-ink-100 dark:bg-navy-800 hover:bg-ink-200 dark:hover:bg-navy-700"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              影响因素
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-ink-50 dark:bg-navy-900/30">
                <div className="flex items-center gap-2">
                  {activeWeather ? (
                    <CloudRain size={18} className="text-blue-500" />
                  ) : (
                    <Sun size={18} className="text-amber-500" />
                  )}
                  <span className="text-sm">
                    {activeWeather ? weatherLabelMap[activeWeather.weatherType] || activeWeather.weatherType : "天气正常"}
                  </span>
                </div>
                {activeWeather && (
                  <span className="text-xs text-crimson-600">
                    +{activeWeather.delayMinutes}分钟
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-ink-50 dark:bg-navy-900/30">
                <div className="flex items-center gap-2">
                  <Wind size={18} className="text-teal-500" />
                  <span className="text-sm">
                    {activeDetour ? "临时绕行" : "线路正常"}
                  </span>
                </div>
                {activeDetour && (
                  <span className="text-xs text-amber-600">
                    +{activeDetour.addedMinutes}分钟
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-ink-50 dark:bg-navy-900/30">
                <div className="flex items-center gap-2">
                  <MapPin
                    size={18}
                    className={activeClosures.length > 0 ? "text-crimson-500" : "text-jade-500"}
                  />
                  <span className="text-sm">
                    {activeClosures.length > 0
                      ? `${activeClosures.length}个站点封闭`
                      : "站点正常"}
                  </span>
                </div>
                {activeClosures.length > 0 && (
                  <span className="text-xs text-crimson-600">需换乘</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-ink-50 dark:bg-navy-900/30">
                <div className="flex items-center gap-2">
                  <Bus
                    size={18}
                    className={
                      selectedVehicle?.status === "full"
                        ? "text-amber-500"
                        : selectedVehicle?.status === "fault"
                        ? "text-crimson-500"
                        : "text-jade-500"
                    }
                  />
                  <span className="text-sm">
                    车辆状态：
                    {selectedVehicle?.status === "full"
                      ? "满员"
                      : selectedVehicle?.status === "fault"
                      ? "故障"
                      : "正常"}
                  </span>
                </div>
                {selectedVehicle && (
                  <span className="text-xs text-ink-500">
                    {selectedVehicle.currentLoad}/{selectedVehicle.capacity}座
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-8 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">线路运行模拟</h2>
                <p className="text-sm text-ink-500 mt-1">
                  {selectedRoute?.name} · 共 {routeStops.length} 站
                </p>
              </div>
              {selectedVehicle && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <Bus size={18} className="text-green-500" />
                  <span className="text-sm font-medium">{selectedVehicle.plateNumber}</span>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-ink-200 dark:bg-navy-700" />

              <div className="space-y-2">
                {routeStops.map((routeStop, index) => {
                  const stop = stops.find((s) => s.id === routeStop.stopId);
                  const status = getStopStatus(routeStop.stopId, index);
                  const isClosed = activeClosures.some(
                    (c) => c.stopId === routeStop.stopId
                  );
                  const isDetourSkip = activeDetour?.skippedStopIds.includes(
                    routeStop.stopId
                  );
                  const arrival = getEstimatedArrival(index);

                  return (
                    <div key={routeStop.stopId} className="relative flex items-start">
                      <div
                        className={`relative z-10 w-16 h-16 rounded-xl flex items-center justify-center transition-all ${
                          status === "passed"
                            ? "bg-jade-100 dark:bg-jade-900/30"
                            : status === "current"
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-110"
                            : isClosed
                            ? "bg-crimson-100 dark:bg-crimson-900/30"
                            : isDetourSkip
                            ? "bg-amber-100 dark:bg-amber-900/30"
                            : "bg-ink-100 dark:bg-navy-800"
                        }`}
                      >
                        {status === "passed" ? (
                          <CheckCircle2 size={24} className="text-jade-600 dark:text-jade-400" />
                        ) : status === "current" ? (
                          <Bus size={24} />
                        ) : isClosed ? (
                          <AlertTriangle size={20} className="text-crimson-600 dark:text-crimson-400" />
                        ) : isDetourSkip ? (
                          <Wind size={20} className="text-amber-600 dark:text-amber-400" />
                        ) : (
                          <MapPin
                            size={20}
                            className="text-ink-400 dark:text-ink-500"
                          />
                        )}
                      </div>

                      <div className="ml-4 flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-lg">
                              {stop?.name || "未知站点"}
                              {status === "current" && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                  当前站
                                </span>
                              )}
                              {isClosed && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-crimson-100 text-crimson-700 dark:bg-crimson-900/30 dark:text-crimson-300">
                                  已封闭
                                </span>
                              )}
                              {isDetourSkip && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                  绕行跳过
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-ink-500 mt-0.5">
                              第 {index + 1} 站 · 距起点 {routeStop.estimatedMinutes} 分钟
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-lg font-bold">
                              {arrival}
                            </div>
                            <div className="text-xs text-ink-500">
                              预计到站
                            </div>
                          </div>
                        </div>

                        {status === "current" && (
                          <div className="mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                              <Bus size={16} />
                              <span className="text-sm font-medium">
                                车辆即将到达本站
                              </span>
                            </div>
                          </div>
                        )}

                        {isClosed && stop?.alternativeStopId && (
                          <div className="mt-2 text-xs text-crimson-600 dark:text-crimson-400">
                            请前往 {stops.find((s) => s.id === stop.alternativeStopId)?.name || "备用站点"} 换乘
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="metric-card glass-card">
              <div className="text-sm text-ink-500 mb-2">总站点数</div>
              <div className="text-2xl font-bold">{routeStops.length}</div>
              <div className="text-xs text-ink-400 mt-1">
                封闭 {activeClosures.filter((c) => routeStops.some((s) => s.stopId === c.stopId)).length} 站
              </div>
            </div>
            <div className="metric-card glass-card">
              <div className="text-sm text-ink-500 mb-2">预计运行时间</div>
              <div className="text-2xl font-bold">
                {routeStops.length > 0
                  ? routeStops[routeStops.length - 1].estimatedMinutes +
                    (activeWeather?.delayMinutes || 0) +
                    (activeDetour?.addedMinutes || 0)
                  : 0}
                分钟
              </div>
              <div className="text-xs text-ink-400 mt-1">
                含延误 {(activeWeather?.delayMinutes || 0) + (activeDetour?.addedMinutes || 0)} 分钟
              </div>
            </div>
            <div className="metric-card glass-card">
              <div className="text-sm text-ink-500 mb-2">当前进度</div>
              <div className="text-2xl font-bold">
                {routeStops.length > 0
                  ? Math.round((currentStopIndex / (routeStops.length - 1)) * 100)
                  : 0}
                %
              </div>
              <div className="text-xs text-ink-400 mt-1">
                第 {currentStopIndex + 1} / {routeStops.length} 站
              </div>
            </div>
          </div>

          {activeDetour && (
            <div className="glass-card p-5 border-l-4 border-amber-500">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Wind size={20} className="text-amber-500" />
                </div>
                <div>
                  <div className="font-semibold">临时绕行通知</div>
                  <div className="text-sm text-ink-500 mt-1">
                    {activeDetour.reason}
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      绕行增加 {activeDetour.addedMinutes} 分钟
                    </span>
                    <span className="mx-2 text-ink-300">|</span>
                    <span className="text-ink-600 dark:text-ink-400">
                      跳过 {activeDetour.skippedStopIds.length} 个站点
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeWeather && (
            <div className="glass-card p-5 border-l-4 border-blue-500">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <CloudRain size={20} className="text-blue-500" />
                </div>
                <div>
                  <div className="font-semibold">天气延误提醒</div>
                  <div className="text-sm text-ink-500 mt-1">
                    {weatherLabelMap[activeWeather.weatherType] || activeWeather.weatherType} - {activeWeather.reason}
                  </div>
                  <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
                    各站点预计延误 {activeWeather.delayMinutes} 分钟
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
