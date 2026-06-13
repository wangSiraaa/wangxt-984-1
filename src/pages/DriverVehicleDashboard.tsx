import { useState } from "react";
import {
  User,
  Car,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  Shield,
  Bus,
  MapPin,
  IdCard,
  Phone,
  Wrench,
  Activity,
  RefreshCw,
  Users,
} from "lucide-react";
import { useBusStore } from "@/stores/busStore";
import { daysUntil, routeColorClass } from "@/lib/utils";

type TabType = "drivers" | "vehicles" | "schedule" | "inspection";

export default function DriverVehicleDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("drivers");

  const { drivers, vehicles, routes, schedules, stops } = useBusStore();

  const tabs: { key: TabType; label: string; icon: typeof User }[] = [
    { key: "drivers", label: "司机看板", icon: User },
    { key: "vehicles", label: "车辆状态", icon: Car },
    { key: "schedule", label: "排班表", icon: Calendar },
    { key: "inspection", label: "年检驾照", icon: FileCheck },
  ];

  const onDutyDrivers = drivers.filter((d) => d.status === "on_duty");
  const offDutyDrivers = drivers.filter((d) => d.status === "off_duty");
  const onLeaveDrivers = drivers.filter((d) => d.status === "leave");

  const normalVehicles = vehicles.filter((v) => v.status === "normal" || v.status === "replacement");
  const faultVehicles = vehicles.filter((v) => v.status === "fault");
  const fullVehicles = vehicles.filter((v) => v.status === "full");

  const today = new Date();
  const todaySchedules = schedules.filter((s) => s.dayOfWeek.includes(today.getDay()));

  const getDriverSchedules = (driverId: string) => {
    return schedules.filter(
      (s) => s.driverId === driverId && s.dayOfWeek.includes(today.getDay())
    );
  };

  const getVehicleSchedules = (vehicleId: string) => {
    return schedules.filter(
      (s) => s.vehicleId === vehicleId && s.dayOfWeek.includes(today.getDay())
    );
  };

  const driverLicenseWarnings = drivers.filter((d) => {
    const days = daysUntil(d.licenseExpiryDate);
    return days <= 30;
  });

  const inspectionWarnings = vehicles.filter((v) => {
    const days = daysUntil(v.inspectionExpiryDate);
    return days <= 30;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl flex items-center gap-3">
            <Activity className="text-green-500" size={28} />
            司机车辆看板
          </h1>
          <p className="text-ink-500 mt-1">
            实时监控司机排班、车辆状态、驾驶证和年检情况
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-ink-500">
          <Clock size={16} />
          <span>{today.toLocaleDateString("zh-CN", { weekday: "long" })}</span>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <div className="metric-card glass-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-jade-100 dark:bg-jade-900/30 flex items-center justify-center">
              <User className="text-jade-500" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{onDutyDrivers.length}</div>
              <div className="text-xs text-ink-500">在岗司机</div>
            </div>
          </div>
        </div>
        <div className="metric-card glass-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Bus className="text-blue-500" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{normalVehicles.length}</div>
              <div className="text-xs text-ink-500">运营车辆</div>
            </div>
          </div>
        </div>
        <div className="metric-card glass-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Calendar className="text-purple-500" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{todaySchedules.length}</div>
              <div className="text-xs text-ink-500">今日班次</div>
            </div>
          </div>
        </div>
        <div className="metric-card glass-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="text-amber-500" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{faultVehicles.length}</div>
              <div className="text-xs text-ink-500">故障车辆</div>
            </div>
          </div>
        </div>
        <div className="metric-card glass-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-crimson-100 dark:bg-crimson-900/30 flex items-center justify-center">
              <Shield className="text-crimson-500" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{driverLicenseWarnings.length}</div>
              <div className="text-xs text-ink-500">驾照临期</div>
            </div>
          </div>
        </div>
        <div className="metric-card glass-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Wrench className="text-orange-500" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{inspectionWarnings.length}</div>
              <div className="text-xs text-ink-500">年检临期</div>
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
                  ? "bg-green-600 text-white shadow-glow"
                  : "text-ink-500 hover:bg-ink-100 dark:hover:bg-navy-800"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "drivers" && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">在岗司机</h2>
            <div className="grid grid-cols-3 gap-4">
              {onDutyDrivers.map((driver) => {
                const driverSchs = getDriverSchedules(driver.id);
                const licenseDays = daysUntil(driver.licenseExpiryDate);
                const firstSchedule = driverSchs.sort(
                  (a, b) => a.departureTime.localeCompare(b.departureTime)
                )[0];
                const lastSchedule = driverSchs.sort(
                  (a, b) => b.departureTime.localeCompare(a.departureTime)
                )[0];
                const vehicle = vehicles.find(
                  (v) => v.id === firstSchedule?.vehicleId
                );
                const route = routes.find((r) => r.id === firstSchedule?.routeId);

                return (
                  <div
                    key={driver.id}
                    className="p-5 rounded-2xl border border-ink-200 dark:border-navy-700 bg-gradient-to-br from-jade-50/50 to-transparent dark:from-jade-900/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-jade-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                          {driver.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{driver.name}</div>
                          <div className="text-sm text-ink-500">
                            工号 {driver.employeeNo}
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs bg-jade-100 text-jade-700 dark:bg-jade-900/30 dark:text-jade-300">
                        在岗
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-ink-600 dark:text-ink-400">
                        <Phone size={14} />
                        <span>{driver.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-ink-600 dark:text-ink-400">
                        <IdCard size={14} />
                        <span>驾照有效期：{driver.licenseExpiryDate}</span>
                        {licenseDays <= 30 && (
                          <span className="text-crimson-600 text-xs">
                            (剩{licenseDays}天)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-ink-200 dark:border-navy-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-ink-500">今日班次</span>
                        <span className="font-medium">{driverSchs.length} 班</span>
                      </div>
                      {driverSchs.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <Clock size={12} className="text-ink-400" />
                          <span className="text-ink-500">
                            {firstSchedule?.departureTime} - {lastSchedule?.departureTime}
                          </span>
                        </div>
                      )}
                      {route && (
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${routeColorClass(route.colorIndex)}`}
                          >
                            {route.code}
                          </span>
                          <span className="text-xs text-ink-500">{route.name}</span>
                        </div>
                      )}
                      {vehicle && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <Car size={14} className="text-ink-400" />
                          <span className="text-ink-600 dark:text-ink-400">
                            {vehicle.plateNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {(offDutyDrivers.length > 0 || onLeaveDrivers.length > 0) && (
            <div className="grid grid-cols-2 gap-6">
              {offDutyDrivers.length > 0 && (
                <div className="glass-card p-6">
                  <h2 className="text-lg font-semibold mb-4">休息司机</h2>
                  <div className="space-y-2">
                    {offDutyDrivers.map((driver) => (
                      <div
                        key={driver.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-ink-50 dark:bg-navy-900/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-ink-200 dark:bg-navy-700 flex items-center justify-center text-ink-500 font-medium">
                            {driver.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{driver.name}</div>
                            <div className="text-xs text-ink-500">{driver.phone}</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-ink-200 text-ink-600 dark:bg-navy-700 dark:text-ink-400">
                          休息
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {onLeaveDrivers.length > 0 && (
                <div className="glass-card p-6">
                  <h2 className="text-lg font-semibold mb-4">休假司机</h2>
                  <div className="space-y-2">
                    {onLeaveDrivers.map((driver) => (
                      <div
                        key={driver.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-300 font-medium">
                            {driver.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{driver.name}</div>
                            <div className="text-xs text-ink-500">{driver.phone}</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          休假
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "vehicles" && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">车辆状态总览</h2>
          <div className="grid grid-cols-4 gap-4">
            {vehicles.map((vehicle) => {
              const route = routes.find((r) => r.id === vehicle.routeId);
              const schs = getVehicleSchedules(vehicle.id);
              const inspectionDays = daysUntil(vehicle.inspectionExpiryDate);
              const loadPercent = (vehicle.currentLoad / vehicle.capacity) * 100;
              const statusMap = {
                normal: { label: "正常", cls: "jade", icon: CheckCircle2 },
                full: { label: "满员", cls: "amber", icon: Users },
                fault: { label: "故障", cls: "crimson", icon: Wrench },
                inspection_expired: { label: "年检过期", cls: "crimson", icon: AlertTriangle },
                replacement: { label: "替换车", cls: "blue", icon: RefreshCw },
              };
              const status = statusMap[vehicle.status] || statusMap.normal;
              const StatusIcon = status.icon;

              return (
                <div
                  key={vehicle.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    vehicle.status === "fault"
                      ? "border-crimson-200 dark:border-crimson-800 bg-crimson-50 dark:bg-crimson-950/10"
                      : vehicle.status === "full"
                      ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/10"
                      : "border-ink-200 dark:border-navy-700 hover:border-blue-300 dark:hover:border-blue-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bus
                        size={20}
                        className={
                          status.cls === "jade"
                            ? "text-jade-500"
                            : status.cls === "amber"
                            ? "text-amber-500"
                            : status.cls === "crimson"
                            ? "text-crimson-500"
                            : "text-blue-500"
                        }
                      />
                      <span className="font-bold">{vehicle.plateNumber}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        status.cls === "jade"
                          ? "bg-jade-100 text-jade-700 dark:bg-jade-900/30 dark:text-jade-300"
                          : status.cls === "amber"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                          : status.cls === "crimson"
                          ? "bg-crimson-100 text-crimson-700 dark:bg-crimson-900/30 dark:text-crimson-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      }`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="text-sm text-ink-500 mb-3">
                    {vehicle.model} · {vehicle.capacity}座
                  </div>

                  {route && (
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${routeColorClass(route.colorIndex)}`}
                      >
                        {route.code}
                      </span>
                      <span className="text-xs text-ink-500">{route.name}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-ink-500">载客量</span>
                        <span className="font-mono">
                          {vehicle.currentLoad}/{vehicle.capacity}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-ink-100 dark:bg-navy-800">
                        <div
                          className={`h-full rounded-full ${
                            loadPercent >= 100
                              ? "bg-crimson-500"
                              : loadPercent >= 80
                              ? "bg-amber-500"
                              : "bg-jade-500"
                          }`}
                          style={{ width: `${Math.min(loadPercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-500">今日班次</span>
                      <span className="font-medium">{schs.length} 班</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-500">年检到期</span>
                      <span className={inspectionDays <= 30 ? "text-crimson-600 font-medium" : ""}>
                        {inspectionDays > 0 ? `剩${inspectionDays}天` : "已过期"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">今日排班表</h2>
          <div className="space-y-3">
            {todaySchedules
              .sort((a, b) => a.departureTime.localeCompare(b.departureTime))
              .map((schedule) => {
                const route = routes.find((r) => r.id === schedule.routeId);
                const vehicle = vehicles.find((v) => v.id === schedule.vehicleId);
                const driver = drivers.find((d) => d.id === schedule.driverId);
                const firstStop = route?.stops[0];
                const lastStop = route?.stops[route.stops.length - 1];
                const firstStopName = firstStop
                  ? stops.find((s) => s.id === firstStop.stopId)?.name
                  : "";
                const lastStopName = lastStop
                  ? stops.find((s) => s.id === lastStop.stopId)?.name
                  : "";

                return (
                  <div
                    key={schedule.id}
                    className="p-4 rounded-2xl border border-ink-200 dark:border-navy-700 flex items-center gap-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    <div className="text-center w-20">
                      <div className="text-2xl font-mono font-bold">
                        {schedule.departureTime}
                      </div>
                      <div className="text-xs text-ink-500">发车时间</div>
                    </div>

                    <div className="w-px h-12 bg-ink-200 dark:bg-navy-700" />

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {route && (
                          <span
                            className={`px-2.5 py-1 rounded-lg text-sm font-bold ${routeColorClass(route.colorIndex)}`}
                          >
                            {route.code}
                          </span>
                        )}
                        <span className="font-medium">{route?.name}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-ink-500">
                        <MapPin size={14} />
                        <span>
                          {firstStopName} → {lastStopName}
                        </span>
                      </div>
                    </div>

                    <div className="w-px h-12 bg-ink-200 dark:bg-navy-700" />

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                          {driver?.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{driver?.name}</div>
                          <div className="text-xs text-ink-500">司机</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Bus size={18} className="text-blue-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {vehicle?.plateNumber}
                          </div>
                          <div className="text-xs text-ink-500">
                            {vehicle?.currentLoad}/{vehicle?.capacity}人
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {activeTab === "inspection" && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <IdCard className="text-amber-500" size={20} />
              驾驶证有效期
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-500 border-b border-ink-200 dark:border-navy-700">
                    <th className="pb-3 font-medium">司机</th>
                    <th className="pb-3 font-medium">工号</th>
                    <th className="pb-3 font-medium">联系电话</th>
                    <th className="pb-3 font-medium">到期日期</th>
                    <th className="pb-3 font-medium">剩余天数</th>
                    <th className="pb-3 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver) => {
                    const days = daysUntil(driver.licenseExpiryDate);
                    const isWarning = days <= 30;
                    const isExpired = days <= 0;

                    return (
                      <tr
                        key={driver.id}
                        className="border-b border-ink-100 dark:border-navy-800 hover:bg-ink-50 dark:hover:bg-navy-900/30"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-medium">
                              {driver.name.charAt(0)}
                            </div>
                            <span className="font-medium">{driver.name}</span>
                          </div>
                        </td>
                        <td className="py-3 font-mono text-ink-500">
                          {driver.employeeNo}
                        </td>
                        <td className="py-3 text-ink-600 dark:text-ink-400">
                          {driver.phone}
                        </td>
                        <td className="py-3 font-mono">{driver.licenseExpiryDate}</td>
                        <td className={`py-3 font-medium ${
                          isExpired ? "text-crimson-600" : isWarning ? "text-amber-600" : "text-jade-600"
                        }`}>
                          {isExpired ? "已过期" : `${days} 天`}
                        </td>
                        <td className="py-3">
                          {isExpired ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-crimson-100 text-crimson-700 dark:bg-crimson-900/30 dark:text-crimson-300">
                              已过期
                            </span>
                          ) : isWarning ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                              临期提醒
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-jade-100 text-jade-700 dark:bg-jade-900/30 dark:text-jade-300">
                              正常
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Wrench className="text-orange-500" size={20} />
              车辆年检
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-500 border-b border-ink-200 dark:border-navy-700">
                    <th className="pb-3 font-medium">车牌号</th>
                    <th className="pb-3 font-medium">车型</th>
                    <th className="pb-3 font-medium">核载人数</th>
                    <th className="pb-3 font-medium">年检到期</th>
                    <th className="pb-3 font-medium">剩余天数</th>
                    <th className="pb-3 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => {
                    const days = daysUntil(vehicle.inspectionExpiryDate);
                    const isWarning = days <= 30;
                    const isExpired = days <= 0;

                    return (
                      <tr
                        key={vehicle.id}
                        className="border-b border-ink-100 dark:border-navy-800 hover:bg-ink-50 dark:hover:bg-navy-900/30"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Bus size={18} className="text-blue-500" />
                            <span className="font-medium">{vehicle.plateNumber}</span>
                          </div>
                        </td>
                        <td className="py-3 text-ink-600 dark:text-ink-400">
                          {vehicle.model}
                        </td>
                        <td className="py-3">{vehicle.capacity} 人</td>
                        <td className="py-3 font-mono">
                          {vehicle.inspectionExpiryDate}
                        </td>
                        <td className={`py-3 font-medium ${
                          isExpired ? "text-crimson-600" : isWarning ? "text-amber-600" : "text-jade-600"
                        }`}>
                          {isExpired ? "已过期" : `${days} 天`}
                        </td>
                        <td className="py-3">
                          {isExpired ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-crimson-100 text-crimson-700 dark:bg-crimson-900/30 dark:text-crimson-300">
                              已过期
                            </span>
                          ) : isWarning ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                              临期提醒
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-jade-100 text-jade-700 dark:bg-jade-900/30 dark:text-jade-300">
                              正常
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
