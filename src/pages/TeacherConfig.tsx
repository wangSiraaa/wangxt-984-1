import { useState } from "react";
import {
  BookOpen,
  Users,
  Route,
  MapPin,
  Shield,
  Clock,
  Plus,
  Check,
  X,
  ArrowLeft,
  Calendar,
  Save,
  AlertTriangle,
} from "lucide-react";
import { useBusStore } from "@/stores/busStore";
import { routeColorClass, gradeLabel } from "@/lib/utils";

type TabType = "grade-routes" | "temp-stops" | "escort-rules";

export default function TeacherConfig() {
  const [activeTab, setActiveTab] = useState<TabType>("grade-routes");
  const [selectedTeacher, setSelectedTeacher] = useState("T001");
  const [selectedGrade, setSelectedGrade] = useState(1);

  const {
    teachers,
    routes,
    stops,
    schedules,
    gradeRouteRules,
    tempStopRules,
    escortRules,
    setGradeRouteRule,
    addTempStopRule,
    setEscortRule,
    addHistory,
  } = useBusStore();

  const teacher = teachers.find((t) => t.id === selectedTeacher);

  const tabs: { key: TabType; label: string; icon: typeof Route }[] = [
    { key: "grade-routes", label: "年级线路规则", icon: Route },
    { key: "temp-stops", label: "临时停靠", icon: MapPin },
    { key: "escort-rules", label: "护送规则", icon: Shield },
  ];

  const currentGradeRule = gradeRouteRules.find(
    (r) => r.teacherId === selectedTeacher && r.grade === selectedGrade
  );

  const currentEscortRule = escortRules.find(
    (r) => r.teacherId === selectedTeacher && r.grade === selectedGrade
  );

  const handleToggleRoute = (routeId: string) => {
    const currentRoutes = currentGradeRule?.allowedRouteIds || [];
    const newRoutes = currentRoutes.includes(routeId)
      ? currentRoutes.filter((id) => id !== routeId)
      : [...currentRoutes, routeId];

    setGradeRouteRule({
      teacherId: selectedTeacher,
      grade: selectedGrade,
      allowedRouteIds: newRoutes,
      effectiveDate: new Date().toISOString().slice(0, 10),
      note: `${selectedGrade}年级可乘线路配置`,
    });

    addHistory({
      type: "rule",
      entityType: "GradeRouteRule",
      entityId: `${selectedTeacher}-${selectedGrade}`,
      action: "rule_change",
      data: { grade: selectedGrade, allowedRoutes: newRoutes },
      operator: teacher?.name || "老师",
    });
  };

  const handleToggleEscort = (stopId: string) => {
    const currentStops = currentEscortRule?.escortStopIds || [];
    const newStops = currentStops.includes(stopId)
      ? currentStops.filter((id) => id !== stopId)
      : [...currentStops, stopId];
    const requireEscort = newStops.length > 0;

    setEscortRule({
      teacherId: selectedTeacher,
      grade: selectedGrade,
      requireEscort,
      escortStopIds: newStops,
      note: `${selectedGrade}年级护送规则`,
    });

    addHistory({
      type: "rule",
      entityType: "EscortRule",
      entityId: `${selectedTeacher}-${selectedGrade}`,
      action: "rule_change",
      data: { grade: selectedGrade, escortStops: newStops, requireEscort },
      operator: teacher?.name || "老师",
    });
  };

  const handleAddTempStop = (scheduleId: string, stopId: string) => {
    const future7 = new Date();
    future7.setDate(future7.getDate() + 7);

    addTempStopRule({
      teacherId: selectedTeacher,
      scheduleId,
      stopId,
      duration: 3,
      reason: "低年级学生临时停靠",
      effectiveDate: new Date().toISOString().slice(0, 10),
      endDate: future7.toISOString().slice(0, 10),
    });

    addHistory({
      type: "rule",
      entityType: "TempStopRule",
      entityId: scheduleId,
      action: "rule_change",
      data: { scheduleId, stopId, duration: 3 },
      operator: teacher?.name || "老师",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl flex items-center gap-3">
            <BookOpen className="text-crimson-500" size={28} />
            老师配置中心
          </h1>
          <p className="text-ink-500 mt-1">
            维护低年级指定线路、临时停靠和特殊放学安排
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="input-base w-auto"
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} - {t.teacherNo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {teacher && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-crimson-500 to-crimson-600 flex items-center justify-center shadow-glow-crimson">
                <Users size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{teacher.name}</h2>
                <p className="text-sm text-ink-500">
                  工号：{teacher.teacherNo} · 负责年级：
                  {teacher.grades.map((g) => gradeLabel(g)).join("、")}
                </p>
              </div>
            </div>
            <div className="text-sm text-ink-500">
              联系电话：{teacher.phone}
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-1.5 inline-flex gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`nav-chip ${
                activeTab === tab.key
                  ? "bg-crimson-600 text-white shadow-glow-crimson"
                  : "text-ink-500 hover:bg-ink-100 dark:hover:bg-navy-800"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "grade-routes" && (
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">年级可乘线路规则</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-500">选择年级：</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(Number(e.target.value))}
                className="input-base w-32"
              >
                {teacher?.grades.map((g) => (
                  <option key={g} value={g}>
                    {gradeLabel(g)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedGrade <= 3 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle size={20} className="text-amber-500" />
              <div>
                <div className="font-medium text-amber-700 dark:text-amber-300">
                  低年级乘车安全提示
                </div>
                <div className="text-sm text-amber-600 dark:text-amber-400">
                  {selectedGrade}
                  年级属于低年级，需要老师指定可乘线路，学生只能乘坐被授权的线路
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {routes.map((route) => {
              const isAllowed = currentGradeRule?.allowedRouteIds.includes(route.id);
              return (
                <div
                  key={route.id}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                    isAllowed
                      ? "border-jade-400 bg-jade-50 dark:bg-jade-950/20 dark:border-jade-700"
                      : "border-ink-200 dark:border-navy-700 hover:border-navy-300 dark:hover:border-navy-600"
                  }`}
                  onClick={() => handleToggleRoute(route.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl ${routeColorClass(route.colorIndex)} flex items-center justify-center`}
                      >
                        <Route size={24} />
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{route.name}</div>
                        <div className="text-sm text-ink-500">
                          {route.code} · {route.stops.length}个站点
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isAllowed
                          ? "bg-jade-500 text-white"
                          : "bg-ink-100 dark:bg-navy-800 text-ink-400"
                      }`}
                    >
                      {isAllowed ? <Check size={18} /> : <X size={18} />}
                    </div>
                  </div>
                  <p className="text-sm text-ink-500 mt-3">{route.description}</p>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-ink-50 dark:bg-navy-900/50 border border-ink-200 dark:border-navy-700">
            <div className="font-medium mb-2">当前配置</div>
            <div className="text-sm text-ink-600 dark:text-ink-300">
              {gradeLabel(selectedGrade)}可乘线路：
              {currentGradeRule && currentGradeRule.allowedRouteIds.length > 0
                ? currentGradeRule.allowedRouteIds
                    .map((id) => routes.find((r) => r.id === id)?.name)
                    .join("、")
                : "未配置任何线路"}
            </div>
          </div>
        </div>
      )}

      {activeTab === "temp-stops" && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">临时停靠规则</h2>
            </div>

            <div className="space-y-4">
              {tempStopRules.length === 0 ? (
                <div className="text-center py-12 text-ink-400">
                  <Clock size={48} className="mx-auto mb-3 opacity-50" />
                  <p>暂无临时停靠规则</p>
                </div>
              ) : (
                tempStopRules.map((rule) => {
                  const schedule = schedules.find((s) => s.id === rule.scheduleId);
                  const stop = stops.find((s) => s.id === rule.stopId);
                  const route = routes.find((r) => r.id === schedule?.routeId);
                  return (
                    <div
                      key={rule.id}
                      className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <MapPin size={20} className="text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {route?.name} - {stop?.name}
                            </div>
                            <div className="text-sm text-ink-500">
                              班次：{schedule?.departureTime} · 停靠{rule.duration}分钟
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-ink-500">
                            {rule.effectiveDate} ~ {rule.endDate}
                          </div>
                          <div className="text-amber-600 dark:text-amber-400 text-xs">
                            {rule.reason}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">添加临时停靠</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-ink-500 block mb-2">选择班次</label>
                <select className="input-base" id="temp-schedule">
                  {schedules.map((s) => {
                    const route = routes.find((r) => r.id === s.routeId);
                    return (
                      <option key={s.id} value={s.id}>
                        {route?.name} - {s.departureTime}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="text-sm text-ink-500 block mb-2">选择站点</label>
                <select className="input-base" id="temp-stop">
                  {stops
                    .filter((s) => !s.isClosed)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => {
                const sch = (document.getElementById("temp-schedule") as HTMLSelectElement)?.value;
                const stp = (document.getElementById("temp-stop") as HTMLSelectElement)?.value;
                if (sch && stp) handleAddTempStop(sch, stp);
              }}
              className="btn-primary mt-4"
            >
              <Plus size={18} />
              添加临时停靠
            </button>
          </div>
        </div>
      )}

      {activeTab === "escort-rules" && (
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">低年级护送规则</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-500">选择年级：</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(Number(e.target.value))}
                className="input-base w-32"
              >
                {teacher?.grades.map((g) => (
                  <option key={g} value={g}>
                    {gradeLabel(g)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedGrade <= 3 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-crimson-50 dark:bg-crimson-950/20 border border-crimson-200 dark:border-crimson-800">
              <Shield size={20} className="text-crimson-500" />
              <div>
                <div className="font-medium text-crimson-700 dark:text-crimson-300">
                  安全护送要求
                </div>
                <div className="text-sm text-crimson-600 dark:text-crimson-400">
                  {selectedGrade}
                  年级学生在指定站点下车时需要老师护送，确保学生安全
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-medium mb-3">需要护送的站点</h3>
            <div className="grid grid-cols-2 gap-3">
              {stops
                .filter((s) => !s.isClosed)
                .map((stop) => {
                  const needsEscort = currentEscortRule?.escortStopIds.includes(stop.id);
                  return (
                    <div
                      key={stop.id}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        needsEscort
                          ? "border-crimson-400 bg-crimson-50 dark:bg-crimson-950/20 dark:border-crimson-700"
                          : "border-ink-200 dark:border-navy-700 hover:border-navy-300"
                      }`}
                      onClick={() => handleToggleEscort(stop.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              needsEscort
                                ? "bg-crimson-500 text-white"
                                : "bg-ink-100 dark:bg-navy-800 text-ink-400"
                            }`}
                          >
                            <MapPin size={18} />
                          </div>
                          <div>
                            <div className="font-medium">{stop.name}</div>
                            <div className="text-xs text-ink-500">{stop.location}</div>
                          </div>
                        </div>
                        {needsEscort && (
                          <span className="text-xs px-2 py-1 rounded-full bg-crimson-100 text-crimson-700 dark:bg-crimson-900/50 dark:text-crimson-300">
                            需护送
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-ink-50 dark:bg-navy-900/50 border border-ink-200 dark:border-navy-700">
            <div className="font-medium mb-2">规则说明</div>
            <ul className="text-sm text-ink-600 dark:text-ink-300 space-y-1">
              <li>• 勾选的站点表示该年级学生下车时需要老师护送</li>
              <li>• 护送站点在学生视图中会显示「需老师护送」标识</li>
              <li>• 低年级学生默认需要在公寓站和教学区站点护送</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
