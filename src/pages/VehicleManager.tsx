import { useState } from "react";
import {
  Bus,
  Wrench,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Calendar,
  Settings,
  ArrowRightLeft,
  Zap,
  Shield,
} from "lucide-react";
import { useBusStore } from "@/stores/busStore";
import { statusLabel, daysUntil, routeColorClass } from "@/lib/utils";

type TabType = "fleet" | "fault" | "replacement" | "capacity";

export default function VehicleManager() {
  const [activeTab, setActiveTab] = useState<TabType>("fleet");

  const {
    vehicles,
    routes,
    schedules,
    updateVehicleStatus,
    assignReplacementVehicle,
    updateVehicleLoad,
    addHistory,
    resetAll,
  } = useBusStore();

  const tabs: { key: TabType; label: string; icon: typeof Bus }[] = [
    { key: "fleet", label: "车队总览", icon: Bus },
    { key: "fault", label: "故障管理", icon: Wrench },
    { key: "replacement", label: "替换车调度", icon: ArrowRightLeft },
    { key: "capacity", label: "载客容量", icon: Users },
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
      operator: "校车管理员",
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
        operator: "校车管理员",
      });
    }
  };

  const handleRepairVehicle = (vehicleId: string) => {
    updateVehicleStatus(vehicleId, "normal");
    addHistory({
      type: "vehicle",
      entityType: "Vehicle",
      entityId: vehicleId,
      action: "update",
      data: { status: "normal", note: "维修完成，恢复运营" },
      operator: "校车管理员",
    });
  };

  const handleAdjustLoad = (vehicleId: string, delta: number) => {
    updateVehicleLoad(vehicleId, delta);
  };

  const stats = [
    {
      label: "正常运营",
      value: vehicles.filter((v) => v.status === "normal").length,
      color: "jade",
      icon: CheckCircle2,
    },
    {
      label: "故障维修",
      value: vehicles.filter((v) => v.status === "fault").length,
      color: "crimson",
      icon: XCircle,
    },
    {
      label: "替换车",
      value: vehicles.filter((v) => v.status === "replacement").length,
      color: "navy",
      icon: RefreshCw,
    },
    {
      label: "满员状态",
      value: vehicles.filter((v) => v.status === "full").length,
      color: "amber",
      icon: Users,
    },
  ];

  const faultVehicles = vehicles.filter((v) => v.status === "fault" || v.status === "inspection_expired");
  const normalVehicles = vehicles.filter((v) => v.status === "normal" || v.status === "replacement");
  const spareVehicles = vehicles.filter((v) => v.status === "normal" && !v.routeId);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl flex items-center gap-3">
            <Bus className="text-blue-500" size={28} />
            车辆管理中心
          </h1>
          <p className="text-ink-500 mt-1">
            车队状态、故障管理、替换车调度、载客容量监控
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => resetAll()}
            className="btn-secondary"
          >
            <RefreshCw size={16} />
            重置数据
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            新增车辆
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="metric-card glass-card">
              <div className="flex items-center justify-between mb-3">
                <div className="text-ink-500 text-sm">{stat.label}</div>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    stat.color === "jade"
                      ? "bg-jade-100 text-jade-600 dark:bg-jade-900/50 dark:text-jade-300"
                      : stat.color === "crimson"
                      ? "bg-crimson-100 text-crimson-600 dark:bg-crimson-900/50 dark:text-crimson-300"
                      : stat.color === "amber"
                      ? "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300"
                      : "bg-navy-100 text-navy-600 dark:bg-navy-800 dark:text-navy-300"
                  }`}
                >
                  <Icon size={16} />
                </div>
              </div>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-sm text-ink-400 mt-1">共 {vehicles.length} 辆车</div>
            </div>
          );
        })}
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
                  ? "bg-blue-600 text-white shadow-glow"
                  : "text-ink-500 hover:bg-ink-100 dark:hover:bg-navy-800"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "fleet" && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">车队总览</h2>
          <div className="space-y-3">
            {vehicles.map((vehicle) => {
              const inspectionDays = daysUntil(vehicle.inspectionExpiryDate);
              const s = statusLabel(vehicle.status);
              const route = routes.find((r) => r.id === vehicle.routeId);
              const loadPercent = (vehicle.currentLoad / vehicle.capacity) * 100;
              const vehicleSchedules = schedules.filter(
                (sch) => sch.vehicleId === vehicle.id
              );

              return (
                <div
                  key={vehicle.id}
                  className="p-5 rounded-2xl border border-ink-200 dark:border-navy-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          vehicle.status === "fault"
                            ? "bg-crimson-100 dark:bg-crimson-900/30"
                            : vehicle.status === "full"
                            ? "bg-amber-100 dark:bg-amber-900/30"
                            : "bg-blue-100 dark:bg-blue-900/30"
                        }`}
                      >
                        <Bus
                          size={28}
                          className={
                            vehicle.status === "fault"
                              ? "text-crimson-500"
                              : vehicle.status === "full"
                              ? "text-amber-500"
                              : "text-blue-500"
                          }
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold">
                            {vehicle.plateNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
                            {s.label}
                          </span>
                          {vehicle.replacementVehicleId && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                              替换车：
                              {vehicles.find((v) => v.id === vehicle.replacementVehicleId)?.plateNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-ink-500 mt-1">
                          {vehicle.model} · 核载{vehicle.capacity}人
                          {route && (
                            <span className="ml-2">
                              · 线路：
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs ${routeColorClass(route.colorIndex)}`}
                              >
                                {route.code}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div>
                        <div className="text-xs text-ink-500 mb-1">当前载客</div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 rounded-full bg-ink-100 dark:bg-navy-800">
                            <div
                              className={`h-full rounded-full transition-all ${
                                loadPercent >= 100
                                  ? "bg-crimson-500"
                                  : loadPercent >= 80
                                  ? "bg-amber-500"
                                  : "bg-jade-500"
                              }`}
                              style={{ width: `${Math.min(loadPercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-mono">
                            {vehicle.currentLoad}/{vehicle.capacity}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm">
                        <div className="text-ink-500">年检到期</div>
                        <div className={`font-medium ${inspectionDays <= 7 ? "text-crimson-600" : ""}`}>
                          {vehicle.inspectionExpiryDate}
                          <span className="ml-2 text-xs">
                            {inspectionDays > 0 ? `剩${inspectionDays}天` : "已过期"}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm">
                        <div className="text-ink-500">今日班次</div>
                        <div className="font-medium">
                          {vehicleSchedules.filter((s) =>
                            s.dayOfWeek.includes(new Date().getDay())
                          ).length}{" "}
                          班
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {vehicle.status === "normal" && (
                          <button
                            onClick={() => handleVehicleFault(vehicle.id)}
                            className="btn-ghost text-sm text-crimson-600"
                          >
                            <Wrench size={16} />
                            报故障
                          </button>
                        )}
                        {vehicle.status === "fault" && (
                          <button
                            onClick={() => handleRepairVehicle(vehicle.id)}
                            className="btn-ghost text-sm text-jade-600"
                          >
                            <CheckCircle2 size={16} />
                            维修完成
                          </button>
                        )}
                        <button className="btn-ghost text-sm">
                          <Settings size={16} />
                          详情
                        </button>
                      </div>
                    </div>
                  </div>

                  {vehicle.faultReason && (
                    <div className="mt-3 pt-3 border-t border-ink-200 dark:border-navy-700">
                      <div className="flex items-center gap-2 text-sm text-crimson-600">
                        <AlertTriangle size={16} />
                        <span>故障原因：{vehicle.faultReason}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "fault" && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">故障车辆管理</h2>
          {faultVehicles.length === 0 ? (
            <div className="text-center py-12 text-ink-400">
              <CheckCircle2 size={48} className="mx-auto mb-3 text-jade-500 opacity-50" />
              <p>所有车辆运行正常</p>
            </div>
          ) : (
            <div className="space-y-4">
              {faultVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="p-5 rounded-2xl border border-crimson-200 dark:border-crimson-800 bg-crimson-50 dark:bg-crimson-950/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-crimson-500/20 flex items-center justify-center">
                        <AlertTriangle size={24} className="text-crimson-500" />
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{vehicle.plateNumber}</div>
                        <div className="text-sm text-ink-500">
                          {vehicle.model} · {vehicle.capacity}座
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-crimson-600 font-medium">
                        {vehicle.status === "fault" ? "故障停运" : "年检过期"}
                      </div>
                      <div className="text-sm text-ink-500">
                        影响线路：{routes.find((r) => r.id === vehicle.routeId)?.name || "待分配"}
                      </div>
                    </div>
                  </div>
                  {vehicle.faultReason && (
                    <div className="mt-3 text-sm text-crimson-700 dark:text-crimson-300">
                      故障描述：{vehicle.faultReason}
                    </div>
                  )}
                  {vehicle.replacementVehicleId && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                      <ArrowRightLeft size={16} />
                      <span>
                        已由替换车{" "}
                        {vehicles.find((v) => v.id === vehicle.replacementVehicleId)?.plateNumber}{" "}
                        接替运营
                      </span>
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleRepairVehicle(vehicle.id)}
                      className="btn-primary text-sm"
                    >
                      <CheckCircle2 size={16} />
                      标记维修完成
                    </button>
                    <button className="btn-secondary text-sm">
                      <Wrench size={16} />
                      查看维修记录
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "replacement" && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">备用车辆池</h2>
            {spareVehicles.length === 0 ? (
              <div className="text-center py-8 text-ink-400">
                <RefreshCw size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无可用备用车辆</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {spareVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="p-4 rounded-xl border border-ink-200 dark:border-navy-700 bg-ink-50 dark:bg-navy-900/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-jade-100 dark:bg-jade-900/30 flex items-center justify-center">
                        <Bus size={20} className="text-jade-500" />
                      </div>
                      <div>
                        <div className="font-medium">{vehicle.plateNumber}</div>
                        <div className="text-xs text-ink-500">
                          {vehicle.model} · {vehicle.capacity}座
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-jade-600">
                      <Zap size={14} />
                      <span>随时可调度</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">替换车调度</h2>
            <p className="text-sm text-ink-500 mb-4">
              当车辆故障时，系统会自动从备用车辆池中分配替换车接替该线路运营
            </p>
            <div className="space-y-3">
              {vehicles
                .filter((v) => v.status === "replacement")
                .map((vehicle) => {
                  const replacedVehicle = vehicles.find(
                    (v) => v.replacementVehicleId === vehicle.id
                  );
                  const route = routes.find((r) => r.id === vehicle.routeId);
                  return (
                    <div
                      key={vehicle.id}
                      className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <ArrowRightLeft size={20} className="text-blue-500" />
                          </div>
                          <div>
                            <div className="font-medium">
                              替换车 {vehicle.plateNumber}
                            </div>
                            <div className="text-sm text-ink-500">
                              接替 {replacedVehicle?.plateNumber || "未知车辆"} 运营
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {route && (
                            <span
                              className={`px-2 py-1 rounded text-xs ${routeColorClass(route.colorIndex)}`}
                            >
                              {route.code}
                            </span>
                          )}
                          <div className="text-xs text-ink-500 mt-1">
                            {vehicle.currentLoad}/{vehicle.capacity}人
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "capacity" && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">载客容量监控</h2>
          <div className="space-y-4">
            {normalVehicles.map((vehicle) => {
              const loadPercent = (vehicle.currentLoad / vehicle.capacity) * 100;
              const route = routes.find((r) => r.id === vehicle.routeId);
              const isFull = vehicle.currentLoad >= vehicle.capacity;

              return (
                <div
                  key={vehicle.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isFull
                      ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"
                      : "border-ink-200 dark:border-navy-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isFull
                            ? "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300"
                            : "bg-ink-100 text-ink-600 dark:bg-navy-800 dark:text-ink-300"
                        }`}
                      >
                        <Users size={20} />
                      </div>
                      <div>
                        <div className="font-semibold">{vehicle.plateNumber}</div>
                        <div className="text-sm text-ink-500">
                          {vehicle.model}
                          {route && ` · ${route.name}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isFull
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                            : "bg-jade-100 text-jade-700 dark:bg-jade-900/50 dark:text-jade-300"
                        }`}
                      >
                        {isFull ? "已满员" : "有座位"}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAdjustLoad(vehicle.id, -1)}
                          className="w-8 h-8 rounded-lg bg-ink-100 dark:bg-navy-800 hover:bg-ink-200 dark:hover:bg-navy-700 flex items-center justify-center text-lg font-bold"
                        >
                          -
                        </button>
                        <span className="w-16 text-center font-mono text-xl font-bold">
                          {vehicle.currentLoad}
                        </span>
                        <button
                          onClick={() => handleAdjustLoad(vehicle.id, 1)}
                          className="w-8 h-8 rounded-lg bg-ink-100 dark:bg-navy-800 hover:bg-ink-200 dark:hover:bg-navy-700 flex items-center justify-center text-lg font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-3 rounded-full bg-ink-100 dark:bg-navy-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          loadPercent >= 100
                            ? "bg-crimson-500"
                            : loadPercent >= 80
                            ? "bg-amber-500"
                            : "bg-jade-500"
                        }`}
                        style={{ width: `${Math.min(loadPercent, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono w-20 text-right">
                      {vehicle.currentLoad} / {vehicle.capacity}
                    </span>
                    <span className="text-sm text-ink-500 w-16 text-right">
                      {Math.round(loadPercent)}%
                    </span>
                  </div>

                  {isFull && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                      <Shield size={16} />
                      <span>满员状态下，站点牌和学生视图将隐藏上车提示</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
