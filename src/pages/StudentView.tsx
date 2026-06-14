import { useState } from "react";
import {
  User,
  MapPin,
  Clock,
  Bus,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  CreditCard,
  Calendar,
  Umbrella,
  Users,
  UserCheck,
  ShieldAlert,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useBusStore } from "@/stores/busStore";
import { useBusDerivation } from "@/hooks/useBusDerivation";
import {
  routeColorClass,
  routeBarClass,
  gradeLabel,
  statusLabel,
  daysUntil,
} from "@/lib/utils";
import type { RouteInvisibilityReason, SwipeAbnormalType } from "@/types";

export default function StudentView() {
  const [showCard, setShowCard] = useState(false);
  const [expandedBlockedRoute, setExpandedBlockedRoute] = useState<string | null>(null);
  const {
    routes,
    stops,
    vehicles,
    schedules,
    drivers,
    students,
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
    currentStudentId,
    setCurrentStudentId,
    addSwipeRecord,
    updateVehicleLoad,
    addHistory,
    addDerivationSnapshot,
    handleSwipeAbnormal,
    simulatedDate,
  } = useBusStore();

  const currentStudent = students.find((s) => s.id === currentStudentId);
  const studentStop = stops.find((s) => s.id === currentStudent?.stopId);
  const effectiveDate = simulatedDate || new Date().toISOString().split("T")[0];

  const { derivationResult, stopArrivals } = useBusDerivation({
    student: currentStudent,
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

  const studentAbnormalRecords = swipeAbnormalRecords.filter(
    (r) => r.studentId === currentStudentId && !r.handled
  );

  const gradeRule = gradeRouteRules.find((r) => r.grade === currentStudent?.grade);
  const escortRule = escortRules.find((r) => r.grade === currentStudent?.grade);
  const parentAuth = parentAuths.find((a) => a.studentId === currentStudentId);
  const activeLeave = leaveRecords.find(
    (l) => l.studentId === currentStudentId && l.status === "approved"
  );
  const activeWeather = weatherDelays.find((w) => w.isActive);
  const stopClosure = stopClosures.find((c) => c.stopId === currentStudent?.stopId && c.isActive);

  const getAbnormalTypeLabel = (type: SwipeAbnormalType): string => {
    const labels: Record<SwipeAbnormalType, string> = {
      no_card: "未带卡",
      card_expired: "卡已过期",
      wrong_route: "线路错误",
      too_early: "刷卡过早",
      too_late: "刷卡过晚",
      already_boarded: "已刷卡乘车",
      capacity_full: "车辆满员",
      stop_closed: "站点已封闭",
    };
    return labels[type] || type;
  };

  const handleSwipe = (route: typeof derivationResult extends null ? never : NonNullable<typeof derivationResult>["availableRoutes"][0]) => {
    if (!currentStudent) return;

    if (route.rollCallStatus === "absent") {
      const abnormalType: SwipeAbnormalType = "wrong_route";
      addSwipeRecord?.({
        studentId: currentStudent.id,
        scheduleId: route.scheduleId,
        stopId: currentStudent.stopId,
        swipeTime: new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        type: "board",
        vehicleId: route.vehicleId,
      });
      addHistory?.({
        type: "swipe_abnormal",
        entityType: "SwipeAbnormalRecord",
        entityId: currentStudent.id,
        action: "swipe_abnormal",
        data: {
          studentName: currentStudent.name,
          route: route.routeName,
          reason: "老师点名未到，禁止乘车",
        },
        operator: "车载刷卡机",
      });
      alert("刷卡失败：老师点名未到，禁止乘车。请联系老师确认。");
      return;
    }

    if (route.hasAbnormalSwipe) {
      alert(`刷卡失败：${route.abnormalReason || "存在未处理的刷卡异常"}。请先联系管理员处理。`);
      return;
    }

    if (route.stopCurrentCount !== undefined && route.stopMaxCapacity !== undefined && route.stopCurrentCount >= route.stopMaxCapacity) {
      const abnormalType: SwipeAbnormalType = "capacity_full";
      addSwipeRecord?.({
        studentId: currentStudent.id,
        scheduleId: route.scheduleId,
        stopId: currentStudent.stopId,
        swipeTime: new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        type: "board",
        vehicleId: route.vehicleId,
      });
      addHistory?.({
        type: "swipe_abnormal",
        entityType: "SwipeAbnormalRecord",
        entityId: currentStudent.id,
        action: "swipe_abnormal",
        data: {
          studentName: currentStudent.name,
          route: route.routeName,
          reason: "站点候车人数已满",
        },
        operator: "车载刷卡机",
      });
      alert("刷卡失败：站点候车人数已满，请等候下一班车。");
      return;
    }

    if (route.availableSeats === 0) {
      const abnormalType: SwipeAbnormalType = "capacity_full";
      addSwipeRecord?.({
        studentId: currentStudent.id,
        scheduleId: route.scheduleId,
        stopId: currentStudent.stopId,
        swipeTime: new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        type: "board",
        vehicleId: route.vehicleId,
      });
      alert("刷卡失败：车辆已满员，请等候下一班车。");
      return;
    }

    addSwipeRecord?.({
      studentId: currentStudent.id,
      scheduleId: route.scheduleId,
      stopId: currentStudent.stopId,
      swipeTime: new Date().toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      type: "board",
      vehicleId: route.vehicleId,
    });
    updateVehicleLoad?.(route.vehicleId, 1);
    addHistory?.({
      type: "swipe",
      entityType: "SwipeRecord",
      entityId: currentStudent.id,
      action: "swipe",
      data: {
        studentName: currentStudent.name,
        route: route.routeName,
        vehicle: route.vehiclePlate,
      },
      operator: "车载刷卡机",
    });

    if (addDerivationSnapshot && currentStudent) {
      addDerivationSnapshot({
        studentId: currentStudent.id,
        timestamp: new Date().toISOString(),
        availableRoutes: derivationResult.availableRoutes.map((r) => ({
          routeId: r.routeId,
          routeName: r.routeName,
          routeCode: r.routeCode,
        })),
        blockedRoutes: derivationResult.blockedRoutes.map((r) => ({
          routeId: r.routeId,
          routeName: r.routeName,
          routeCode: r.routeCode,
        })),
        derivationSteps: derivationResult.derivationSteps,
        systemState: derivationResult.systemState,
      });
    }
  };

  if (!currentStudent || !derivationResult) {
    return (
      <div className="glass-card p-12 text-center">
        <User size={48} className="mx-auto mb-4 text-ink-300" />
        <p className="text-ink-500">请选择学生</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center text-white text-2xl font-bold shadow-glow">
              {currentStudent.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="section-title text-2xl">{currentStudent.name}</h1>
                {currentStudent.identity === "boarder" && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                    住校生
                  </span>
                )}
                {activeLeave && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-crimson-100 text-crimson-700 dark:bg-crimson-950/50 dark:text-crimson-300">
                    请假中
                  </span>
                )}
              </div>
              <div className="text-ink-500 mt-1">
                {currentStudent.className} · {gradeLabel(currentStudent.grade)} · {currentStudent.studentNo}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1 text-ink-500">
                  <MapPin size={14} />
                  <span>{studentStop?.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield size={14} className={currentStudent.parentAuthorized ? "text-jade-500" : "text-crimson-500"} />
                  <span className={currentStudent.parentAuthorized ? "text-jade-600" : "text-crimson-600"}>
                    {currentStudent.parentAuthorized ? "家长已授权" : "家长未授权"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={currentStudentId}
              onChange={(e) => setCurrentStudentId(e.target.value)}
              className="input-base w-auto"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {s.className}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowCard(true)}
              className="btn-secondary"
            >
              <CreditCard size={16} />
              乘车卡
            </button>
          </div>
        </div>
      </div>

      {showCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowCard(false)}>
          <div className="relative w-96 aspect-[1.586] rounded-3xl overflow-hidden shadow-2xl animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-gradient-to-br from-navy-600 via-navy-700 to-navy-900" />
            <div className="absolute inset-0 bg-grid-slate opacity-20" />
            <div className="absolute inset-0 bg-radial-navy opacity-50" />
            <div className="relative h-full p-6 text-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold tracking-wider">校园校车卡</div>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bus size={20} />
                  </div>
                </div>
                <div className="mt-8 text-4xl font-mono font-bold tracking-widest opacity-90">
                  {currentStudent.cardNumber}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">{currentStudent.name}</div>
                <div className="opacity-70 mt-1">{currentStudent.className} · {gradeLabel(currentStudent.grade)}</div>
                <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-sm opacity-70">
                  <span>有效期至</span>
                  <span>2026-07-31</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="metric-card glass-card">
          <div className="flex items-center gap-2 text-ink-500 text-sm">
            <Bus size={14} />
            <span>可乘线路</span>
          </div>
          <div className="text-3xl font-bold text-jade-600 mt-2">
            {derivationResult.availableRoutes.length}
          </div>
        </div>
        <div className="metric-card glass-card">
          <div className="flex items-center gap-2 text-ink-500 text-sm">
            <XCircle size={14} />
            <span>限制线路</span>
          </div>
          <div className="text-3xl font-bold text-crimson-600 mt-2">
            {derivationResult.blockedRoutes.length}
          </div>
        </div>
        <div className="metric-card glass-card">
          <div className="flex items-center gap-2 text-ink-500 text-sm">
            <CheckCircle2 size={14} />
            <span>已刷卡乘车</span>
          </div>
          <div className="text-3xl font-bold text-navy-600 mt-2">
            {derivationResult.availableRoutes.filter((r) => r.boarded).length}
          </div>
        </div>
        <div className="metric-card glass-card">
          <div className="flex items-center gap-2 text-ink-500 text-sm">
            <Calendar size={14} />
            <span>授权到期</span>
          </div>
          <div className="text-3xl font-bold mt-2">
            {parentAuth ? daysUntil(parentAuth.expiresAt) : "-"}
            <span className="text-lg font-normal text-ink-400">天</span>
          </div>
        </div>
      </div>

      {(activeWeather || stopClosure || activeLeave || studentAbnormalRecords.length > 0 || derivationResult.transferHints.length > 0) && (
        <div className="space-y-3">
          {activeLeave && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-crimson-50 dark:bg-crimson-950/30 border border-crimson-200 dark:border-crimson-800">
              <Calendar size={20} className="text-crimson-500" />
              <div className="flex-1">
                <div className="font-medium text-crimson-700 dark:text-crimson-300">请假期间暂停乘车</div>
                <div className="text-sm text-crimson-600 dark:text-crimson-400">
                  {activeLeave.reason}（{activeLeave.startDate} 至 {activeLeave.endDate}）
                </div>
              </div>
            </div>
          )}
          {studentAbnormalRecords.length > 0 && (
            <div className="p-4 rounded-2xl bg-crimson-50 dark:bg-crimson-950/30 border border-crimson-200 dark:border-crimson-800">
              <div className="flex items-center gap-3 mb-2">
                <ShieldAlert size={20} className="text-crimson-500" />
                <div className="font-medium text-crimson-700 dark:text-crimson-300">存在未处理的刷卡异常</div>
              </div>
              <div className="space-y-2 ml-8">
                {studentAbnormalRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between text-sm">
                    <span className="text-crimson-600 dark:text-crimson-400">
                      {getAbnormalTypeLabel(record.abnormalType)}：{record.description}
                    </span>
                    <button
                      onClick={() => handleSwipeAbnormal?.(record.id, "学生本人")}
                      className="px-3 py-1 text-xs rounded-lg bg-crimson-100 text-crimson-700 hover:bg-crimson-200 dark:bg-crimson-900/50 dark:text-crimson-300 dark:hover:bg-crimson-900/70 transition-colors"
                    >
                      确认处理
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {derivationResult.transferHints.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3 mb-2">
                <ArrowRight size={20} className="text-amber-500" />
                <div className="font-medium text-amber-700 dark:text-amber-300">换乘提示</div>
              </div>
              <div className="space-y-1 ml-8">
                {derivationResult.transferHints.map((hint, idx) => (
                  <div key={idx} className="text-sm text-amber-600 dark:text-amber-400">
                    {hint}
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeWeather && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <Umbrella size={20} className="text-blue-500" />
              <div>
                <span className="font-medium text-blue-700 dark:text-blue-300">天气影响：</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {activeWeather.reason}，部分线路预计延误 {activeWeather.delayMinutes} 分钟
                </span>
              </div>
            </div>
          )}
          {stopClosure && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <AlertTriangle size={20} className="text-amber-500" />
              <div>
                <span className="font-medium text-amber-700 dark:text-amber-300">站点封闭提醒：</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {stopClosure.reason}，请前往 {stops.find((s) => s.id === stopClosure.alternativeStopId)?.name || "附近站点"} 乘车
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">可乘线路</h2>
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <Clock size={14} />
            <span>实时更新</span>
          </div>
        </div>

        {derivationResult.availableRoutes.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle size={48} className="mx-auto mb-4 text-amber-500" />
            <p className="text-ink-600 dark:text-ink-300 font-medium">暂无可用线路</p>
            <p className="text-ink-500 text-sm mt-1">请查看下方规则解释或联系老师</p>
          </div>
        ) : (
          <div className="space-y-4">
            {derivationResult.availableRoutes.map((route, idx) => {
              const r = routes.find((rt) => rt.id === route.routeId);
              return (
                <div
                  key={route.scheduleId}
                  className={`relative overflow-hidden rounded-2xl border transition-all ${
                    route.boarded
                      ? "border-jade-300 bg-jade-50/50 dark:bg-jade-950/20 dark:border-jade-800"
                      : idx === 0
                      ? "border-navy-300 bg-navy-50/50 dark:bg-navy-900/30 dark:border-navy-700 shadow-glow"
                      : "border-ink-200 dark:border-navy-700 hover:border-navy-300"
                  }`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${routeBarClass(route.colorIndex)}`} />
                  <div className="p-5 pl-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1.5 rounded-lg font-medium ${routeColorClass(route.colorIndex)}`}>
                          {route.routeCode}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-lg">{route.routeName}</span>
                            {route.isTempStop && (
                              <span className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                临时停靠
                              </span>
                            )}
                            {route.requiresEscort && (
                              <span className="px-2 py-0.5 text-xs rounded bg-crimson-100 text-crimson-700 dark:bg-crimson-900/50 dark:text-crimson-300">
                                需老师护送
                              </span>
                            )}
                            {route.boarded && (
                              <span className="px-2 py-0.5 text-xs rounded bg-jade-100 text-jade-700 dark:bg-jade-900/50 dark:text-jade-300">
                                已刷卡
                              </span>
                            )}
                            {route.rollCallStatus && route.rollCallStatus !== "unknown" && (
                              <span
                                className={`px-2 py-0.5 text-xs rounded ${
                                  route.rollCallStatus === "present"
                                    ? "bg-jade-100 text-jade-700 dark:bg-jade-900/50 dark:text-jade-300"
                                    : route.rollCallStatus === "absent"
                                    ? "bg-crimson-100 text-crimson-700 dark:bg-crimson-900/50 dark:text-crimson-300"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                                }`}
                              >
                                {route.rollCallStatus === "present" ? "已点名" : route.rollCallStatus === "absent" ? "未到" : "请假"}
                              </span>
                            )}
                            {route.driverStatus && route.driverStatus !== "scheduled" && route.driverStatus !== "on_duty" && (
                              <span
                                className={`px-2 py-0.5 text-xs rounded ${
                                  route.driverStatus === "replaced"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                                    : "bg-crimson-100 text-crimson-700 dark:bg-crimson-900/50 dark:text-crimson-300"
                                }`}
                              >
                                {route.driverStatus === "replaced" ? "代班司机" : route.driverStatus === "leave" ? "司机请假" : "司机离岗"}
                              </span>
                            )}
                            {route.hasAbnormalSwipe && (
                              <span className="px-2 py-0.5 text-xs rounded bg-crimson-100 text-crimson-700 dark:bg-crimson-900/50 dark:text-crimson-300">
                                刷卡异常
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-ink-500 mt-0.5">
                            {route.vehiclePlate} · {route.driverName} 驾驶
                            {route.stopCurrentCount !== undefined && route.stopMaxCapacity !== undefined && (
                              <span className="ml-3">
                                站点候车 {route.stopCurrentCount}/{route.stopMaxCapacity} 人
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <div className="text-xs text-ink-500 mb-1">发车时间</div>
                          <div className="font-mono font-medium">{route.departureTime}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-ink-500 mb-1">预计到站</div>
                          <div className="font-mono font-bold text-xl">{route.estimatedArrival}</div>
                          {route.delayMinutes > 0 && (
                            <div className="text-amber-600 text-xs font-medium">
                              晚点 {route.delayMinutes} 分钟
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-ink-500 mb-1">剩余座位</div>
                          <div className="flex items-center justify-center gap-1">
                            <Users size={14} className="text-ink-400" />
                            <span
                              className={`font-bold text-lg ${
                                route.availableSeats === 0
                                  ? "text-crimson-600"
                                  : route.availableSeats <= 5
                                  ? "text-amber-600"
                                  : "text-jade-600"
                              }`}
                            >
                              {route.availableSeats}
                            </span>
                          </div>
                        </div>
                        <div>
                          {route.boarded ? (
                            <button disabled className="btn-secondary opacity-50 cursor-not-allowed">
                              <CheckCircle2 size={16} />
                              已乘车
                            </button>
                          ) : route.availableSeats > 0 && route.rollCallStatus !== "absent" && !route.hasAbnormalSwipe ? (
                            <button
                              onClick={() => handleSwipe(route)}
                              className="btn-primary"
                            >
                              <CreditCard size={16} />
                              刷卡乘车
                            </button>
                          ) : (
                            <button disabled className="btn-secondary opacity-50 cursor-not-allowed">
                              {route.rollCallStatus === "absent" ? (
                                <>
                                  <UserCheck size={16} />
                                  未点名
                                </>
                              ) : route.hasAbnormalSwipe ? (
                                <>
                                  <ShieldAlert size={16} />
                                  异常
                                </>
                              ) : (
                                <>
                                  <Users size={16} />
                                  已满员
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {route.boardingHints && route.boardingHints.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-ink-100 dark:border-navy-700 space-y-2">
                        {route.boardingHints.map((hint) => (
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
                              <XCircle size={16} />
                            ) : hint.type === "warning" ? (
                              <AlertTriangle size={16} />
                            ) : (
                              <Info size={16} />
                            )}
                            {hint.message}
                            {hint.details && (
                              <span className="opacity-75 ml-1">({hint.details})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {derivationResult.blockedRoutes.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <XCircle size={18} className="text-crimson-500" />
            不可乘线路
            <span className="text-sm font-normal text-ink-500 ml-2">
              （点击展开查看详细原因）
            </span>
          </h2>
          <div className="space-y-3">
            {derivationResult.blockedRoutes.map((route) => {
              const isExpanded = expandedBlockedRoute === route.scheduleId;
              const invisibilityReasons = (route as any).invisibilityReasons as RouteInvisibilityReason[] | undefined;
              return (
                <div
                  key={route.scheduleId}
                  className="rounded-xl bg-ink-50 dark:bg-navy-900/30 border border-ink-200 dark:border-navy-700 overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-ink-100 dark:hover:bg-navy-900/50 transition-colors"
                    onClick={() => setExpandedBlockedRoute(isExpanded ? null : route.scheduleId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-lg text-sm font-medium ${routeColorClass(route.colorIndex)}`}>
                        {route.routeCode}
                      </div>
                      <span className="font-medium">{route.routeName}</span>
                      <span className="font-mono text-ink-500">{route.departureTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {route.blockReasons.slice(0, 2).map((reason, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs rounded-full bg-crimson-100 text-crimson-700 dark:bg-crimson-950/50 dark:text-crimson-300"
                        >
                          {reason}
                        </span>
                      ))}
                      {isExpanded ? (
                        <ChevronUp size={18} className="text-ink-400" />
                      ) : (
                        <ChevronDown size={18} className="text-ink-400" />
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-ink-100 dark:border-navy-700">
                      <div className="pt-4 space-y-3">
                        {invisibilityReasons && invisibilityReasons.length > 0 ? (
                          <>
                            <div className="text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">
                              为什么看不到这条线路？
                            </div>
                            {invisibilityReasons.map((reason, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg bg-white dark:bg-navy-800 border border-ink-100 dark:border-navy-700"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-crimson-100 dark:bg-crimson-900/50 flex items-center justify-center text-xs font-bold text-crimson-600 dark:text-crimson-300">
                                    {reason.blockStep}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-ink-700 dark:text-ink-200">
                                      {reason.blockReason}
                                    </div>
                                    {reason.blockData && (
                                      <div className="mt-1 text-sm text-ink-500 dark:text-ink-400 font-mono text-xs bg-ink-50 dark:bg-navy-900/50 p-2 rounded">
                                        {JSON.stringify(reason.blockData, null, 2)}
                                      </div>
                                    )}
                                    {reason.suggestion && (
                                      <div className="mt-2 text-sm text-jade-600 dark:text-jade-400 flex items-center gap-1">
                                        <CheckCircle2 size={14} />
                                        建议：{reason.suggestion}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="text-sm text-ink-500 dark:text-ink-400">
                            阻塞原因：{route.blockReasons.join("、")}
                          </div>
                        )}
                        <div className="pt-2 text-xs text-ink-400 flex items-center gap-1">
                          <Info size={12} />
                          线路可见性由资格、年级、站点、车辆、司机排班、老师规则和临时安排实时推导
                        </div>
                      </div>
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