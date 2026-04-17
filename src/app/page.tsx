"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useProfiles } from "@/lib/hooks";
import type { Meal, FoodItem, WeightEntry } from "@/lib/types";
import ProfileSelector from "@/components/ProfileSelector";
import CalorieRing from "@/components/CalorieRing";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Flame,
  TrendingDown,
  TrendingUp,
  Beef,
  Wheat,
  Droplets,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Coffee,
  Sun,
  Moon,
  UtensilsCrossed,
  Plus,
  CalendarDays,
  Pencil,
  Check,
  X,
  Minus,
  Scale,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { format, addDays, subDays, isToday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const MEAL_SECTIONS = [
  { type: "breakfast", label: "Petit-dejeuner", icon: Coffee, pill: "pill-amber" },
  { type: "lunch", label: "Dejeuner", icon: Sun, pill: "pill-blue" },
  { type: "dinner", label: "Diner", icon: Moon, pill: "pill-purple" },
  { type: "snack", label: "Snack", icon: UtensilsCrossed, pill: "pill-pink" },
];

export default function DashboardWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-14 h-14 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin-slow" /></div>}>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    profiles,
    activeProfile,
    activeProfileId,
    adminProfileId,
    setActiveProfileId,
    loading,
    refetch: refetchProfiles,
  } = useProfiles();
  const [meals, setMeals] = useState<Meal[]>([]);
  const initialDate = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
  const [date, setDateState] = useState(initialDate);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const isTodaySelected = isToday(parseISO(date));

  // Weight state
  const [todayWeight, setTodayWeight] = useState<number | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [editingWeight, setEditingWeight] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);

  // Rolling average state
  const [weeklyCalories, setWeeklyCalories] = useState<{ date: string; calories: number }[]>([]);

  const setDate = (newDate: string) => {
    setDateState(newDate);
    router.replace(`/?date=${newDate}`, { scroll: false });
  };

  // The viewer is the profile stored in localStorage (the "logged in" user)
  const viewerProfileId = typeof window !== "undefined"
    ? localStorage.getItem("food-analyzer-profile-id")
    : null;

  const fetchMeals = useCallback(async () => {
    if (!activeProfileId) return;
    setLoadingMeals(true);
    const viewerParam = viewerProfileId ? `&viewer_id=${viewerProfileId}` : "";
    const res = await fetch(
      `/api/meals?profile_id=${activeProfileId}&date=${date}${viewerParam}`
    );
    const data = await res.json();
    setMeals(Array.isArray(data) ? data : []);
    setLoadingMeals(false);
  }, [activeProfileId, date, viewerProfileId]);

  // Fetch weight for selected date
  const fetchWeight = useCallback(async () => {
    if (!activeProfileId) return;
    const res = await fetch(`/api/weight?profile_id=${activeProfileId}&date=${date}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      setTodayWeight(data[0].weight);
      setWeightInput(String(data[0].weight));
    } else {
      setTodayWeight(null);
      setWeightInput("");
    }
  }, [activeProfileId, date]);

  // Fetch last 7 days for rolling average
  const fetchWeeklyData = useCallback(async () => {
    if (!activeProfileId) return;
    const to = date;
    const from = format(subDays(parseISO(date), 6), "yyyy-MM-dd");
    const res = await fetch(
      `/api/meals?profile_id=${activeProfileId}&from=${from}&to=${to}`
    );
    const data = await res.json();
    if (!Array.isArray(data)) return;

    // Group by date
    const byDate: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(parseISO(date), i), "yyyy-MM-dd");
      byDate[d] = 0;
    }
    data.forEach((m: Meal) => {
      if (byDate[m.date] !== undefined) {
        byDate[m.date] += m.total_calories;
      }
    });
    setWeeklyCalories(
      Object.entries(byDate).map(([d, cal]) => ({ date: d, calories: Math.round(cal) }))
    );
  }, [activeProfileId, date]);

  useEffect(() => {
    fetchMeals();
    fetchWeight();
    fetchWeeklyData();
  }, [fetchMeals, fetchWeight, fetchWeeklyData]);

  const saveWeight = async () => {
    if (!activeProfileId || !weightInput.trim()) return;
    const w = parseFloat(weightInput);
    if (isNaN(w) || w < 20 || w > 300) return;
    setSavingWeight(true);
    await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: activeProfileId, date, weight: w }),
    });
    setTodayWeight(w);
    setEditingWeight(false);
    setSavingWeight(false);
    // Refetch profile since goals may have been recalculated
    await refetchProfiles();
  };

  const deleteMeal = async (id: string) => {
    await fetch("/api/meals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchMeals();
    fetchWeeklyData();
  };

  // Meal editing state
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editFoodItems, setEditFoodItems] = useState<FoodItem[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const startEditMeal = (meal: Meal) => {
    setEditingMealId(meal.id);
    setEditFoodItems(meal.food_items ? meal.food_items.map((item) => ({ ...item })) : []);
  };

  const cancelEditMeal = () => {
    setEditingMealId(null);
    setEditFoodItems([]);
  };

  const updateEditItem = (index: number, quantity: number) => {
    const items = [...editFoodItems];
    const item = { ...items[index] };
    const ratio = item.quantity > 0 ? quantity / item.quantity : 1;
    item.quantity = quantity;
    item.calories = Math.round(item.calories * ratio);
    item.protein = Math.round(item.protein * ratio * 10) / 10;
    item.carbs = Math.round(item.carbs * ratio * 10) / 10;
    item.fat = Math.round(item.fat * ratio * 10) / 10;
    items[index] = item;
    setEditFoodItems(items);
  };

  const removeEditItem = (index: number) => {
    setEditFoodItems(editFoodItems.filter((_, i) => i !== index));
  };

  const saveEditMeal = async () => {
    if (!editingMealId || editFoodItems.length === 0) return;
    setSavingEdit(true);
    const totals = {
      total_calories: editFoodItems.reduce((s, f) => s + f.calories, 0),
      total_protein: editFoodItems.reduce((s, f) => s + f.protein, 0),
      total_carbs: editFoodItems.reduce((s, f) => s + f.carbs, 0),
      total_fat: editFoodItems.reduce((s, f) => s + f.fat, 0),
    };
    await fetch("/api/meals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingMealId,
        food_items: editFoodItems.map(({ name, quantity, unit, calories, protein, carbs, fat }) => ({
          name, quantity, unit, calories, protein, carbs, fat,
        })),
        ...totals,
      }),
    });
    setSavingEdit(false);
    cancelEditMeal();
    fetchMeals();
    fetchWeeklyData();
  };

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.total_calories,
      protein: acc.protein + m.total_protein,
      carbs: acc.carbs + m.total_carbs,
      fat: acc.fat + m.total_fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const goal = activeProfile?.daily_calories_goal || 2000;
  const deficit = goal - totals.calories;
  const percentUsed = Math.min((totals.calories / goal) * 100, 100);

  // Group meals by type
  const mealsByType = MEAL_SECTIONS.map((section) => ({
    ...section,
    meals: meals.filter((m) => m.meal_type === section.type),
  }));

  // Incomplete day detection: fewer than 2 main meals (breakfast/lunch/dinner) logged
  const mainMealTypes = ["breakfast", "lunch", "dinner"];
  const loggedMainMeals = mainMealTypes.filter((t) =>
    meals.some((m) => m.meal_type === t)
  );
  const isIncomplete = isTodaySelected && totals.calories > 0 && loggedMainMeals.length < 2;

  // 7-day rolling average
  const rollingAvg = weeklyCalories.length > 0
    ? Math.round(weeklyCalories.reduce((s, d) => s + d.calories, 0) / weeklyCalories.filter(d => d.calories > 0).length || 0)
    : 0;
  const daysWithData = weeklyCalories.filter(d => d.calories > 0).length;

  // Mini bar chart max
  const maxWeeklyCal = Math.max(...weeklyCalories.map(d => d.calories), goal);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-14 h-14 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin-slow" />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="float-orb w-64 h-64 bg-emerald-300 top-20 -left-20" />
        <div className="float-orb w-48 h-48 bg-orange-200 bottom-20 right-10" />
        <div className="glass p-12 max-w-md animate-scale-in">
          <div className="w-20 h-20 gradient-green rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-xl shadow-green-500/20 animate-float">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Food Scanner
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Scannez vos repas avec l&apos;IA et atteignez vos objectifs de
            deficit calorique.
          </p>
          <Link href="/settings" className="btn-primary inline-block">
            Creer un profil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="float-orb w-80 h-80 bg-emerald-200 -top-40 -right-40" />
      <div className="float-orb w-60 h-60 bg-orange-200 top-96 -left-20" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            Votre suivi nutritionnel
          </p>
        </div>
        <ProfileSelector
          profiles={profiles}
          activeProfileId={activeProfileId}
          adminProfileId={adminProfileId}
          onSelect={setActiveProfileId}
          onReturnToAdmin={adminProfileId ? () => setActiveProfileId(adminProfileId) : undefined}
        />
      </div>

      {/* Date picker */}
      <div className="glass-strong flex items-center justify-center gap-2 mb-6 py-3 px-4 animate-fade-in">
        <button
          onClick={() =>
            setDate(format(subDays(parseISO(date), 1), "yyyy-MM-dd"))
          }
          className="p-2 rounded-xl hover:bg-white/60 transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={() => dateInputRef.current?.showPicker()}
          className="text-base font-semibold text-gray-700 min-w-[180px] text-center capitalize hover:bg-white/50 rounded-xl px-3 py-1.5 transition-all flex items-center justify-center gap-2"
        >
          {isTodaySelected ? "Aujourd'hui" : format(parseISO(date), "EEEE d MMMM", { locale: fr })}
          <CalendarDays className="w-4 h-4 text-gray-400" />
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
        />
        <button
          onClick={() =>
            setDate(format(addDays(parseISO(date), 1), "yyyy-MM-dd"))
          }
          className="p-2 rounded-xl hover:bg-white/60 transition-all"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        {!isTodaySelected && (
          <button
            onClick={() => setDate(format(new Date(), "yyyy-MM-dd"))}
            className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all"
          >
            Aujourd&apos;hui
          </button>
        )}
      </div>

      {/* Incomplete day warning */}
      {isIncomplete && (
        <div className="glass p-4 mb-4 border-l-4 border-l-amber-400 flex items-center gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-700">Journee incomplete</p>
            <p className="text-xs text-gray-400">
              Seulement {loggedMainMeals.length}/3 repas principaux enregistres ({loggedMainMeals.map(t =>
                t === "breakfast" ? "petit-dej" : t === "lunch" ? "dejeuner" : "diner"
              ).join(", ") || "aucun"})
            </p>
          </div>
        </div>
      )}

      {/* Weight card */}
      <div className="glass p-4 mb-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Poids du jour</p>
              {!editingWeight ? (
                <p className="text-lg font-bold text-gray-800">
                  {todayWeight ? `${todayWeight} kg` : "Non renseigne"}
                </p>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    type="number"
                    step="0.1"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    placeholder="75.0"
                    className="w-20 input-glass text-sm font-bold py-1 px-2"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && saveWeight()}
                  />
                  <span className="text-xs text-gray-400">kg</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {editingWeight ? (
              <>
                <button
                  onClick={() => { setEditingWeight(false); setWeightInput(todayWeight ? String(todayWeight) : ""); }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={saveWeight}
                  disabled={savingWeight}
                  className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-500 hover:text-emerald-600 transition-all"
                >
                  <Check className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => { setEditingWeight(true); setWeightInput(todayWeight ? String(todayWeight) : ""); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-all"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main calorie card */}
      <div className="glass p-8 mb-6 animate-scale-in">
        <div className="flex items-center justify-around flex-wrap gap-4">
          <CalorieRing
            consumed={totals.calories}
            goal={goal}
            label="Calories"
            color="#10b981"
            size={150}
          />
          <div className="flex flex-col gap-4">
            <CalorieRing
              consumed={totals.protein}
              goal={activeProfile?.daily_protein_goal || 150}
              label="Proteines"
              color="#3b82f6"
              size={85}
            />
            <CalorieRing
              consumed={totals.carbs}
              goal={activeProfile?.daily_carbs_goal || 250}
              label="Glucides"
              color="#f97316"
              size={85}
            />
            <CalorieRing
              consumed={totals.fat}
              goal={activeProfile?.daily_fat_goal || 65}
              label="Lipides"
              color="#a855f7"
              size={85}
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="stat-bar">
            <div
              className="stat-bar-fill"
              style={{
                width: `${percentUsed}%`,
                background:
                  percentUsed > 100
                    ? "linear-gradient(90deg, #ef4444, #dc2626)"
                    : "linear-gradient(90deg, #10b981, #059669)",
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>0 kcal</span>
            <span>{goal} kcal</span>
          </div>
        </div>
      </div>

      {/* Deficit card */}
      <div
        className={`${deficit > 0 ? "glass-dark" : "glass-orange"} p-5 mb-6 flex items-center gap-4 animate-fade-in`}
      >
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
          {deficit > 0 ? (
            <TrendingDown className="w-6 h-6" />
          ) : (
            <TrendingUp className="w-6 h-6" />
          )}
        </div>
        <div>
          <p className="text-sm opacity-80">
            {deficit > 0 ? "Deficit calorique" : "Surplus calorique"}
          </p>
          <p className="text-2xl font-bold tracking-tight">
            {deficit > 0 ? "-" : "+"}
            {Math.abs(Math.round(deficit))} kcal
          </p>
        </div>
        <div className="ml-auto">
          <span className="text-xs opacity-70 bg-white/15 px-3 py-1 rounded-full">
            {deficit > 0 ? "En bonne voie" : "Attention"}
          </span>
        </div>
      </div>

      {/* Quick macro stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { icon: Flame, value: Math.round(totals.calories), unit: "kcal", gradient: "gradient-green", shadow: "shadow-green-500/20" },
          { icon: Beef, value: Math.round(totals.protein), unit: "g prot", gradient: "gradient-blue", shadow: "shadow-blue-500/20" },
          { icon: Wheat, value: Math.round(totals.carbs), unit: "g gluc", gradient: "gradient-orange", shadow: "shadow-orange-500/20" },
          { icon: Droplets, value: Math.round(totals.fat), unit: "g lip", gradient: "gradient-purple", shadow: "shadow-purple-500/20" },
        ].map(({ icon: Icon, value, unit, gradient, shadow }, i) => (
          <div
            key={unit}
            className={`${gradient} rounded-2xl p-3 text-white text-center shadow-lg ${shadow} animate-fade-in`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <Icon className="w-4 h-4 mx-auto mb-1 opacity-80" />
            <p className="text-lg font-bold">{value}</p>
            <p className="text-[10px] opacity-70 font-medium">{unit}</p>
          </div>
        ))}
      </div>

      {/* 7-day rolling average + mini chart */}
      {weeklyCalories.length > 0 && (
        <div className="glass p-5 mb-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-bold text-gray-700">7 derniers jours</h3>
            {daysWithData > 0 && (
              <span className={`pill text-[10px] ml-auto ${rollingAvg <= goal ? "pill-green" : "pill-red"}`}>
                Moy: {rollingAvg} kcal
              </span>
            )}
          </div>
          <div className="flex items-end gap-1.5 h-20">
            {weeklyCalories.map((d) => {
              const pct = maxWeeklyCal > 0 ? (d.calories / maxWeeklyCal) * 100 : 0;
              const isOver = d.calories > goal;
              const isSelected = d.date === date;
              return (
                <button
                  key={d.date}
                  onClick={() => setDate(d.date)}
                  className={`flex-1 rounded-t-lg transition-all relative group ${
                    isSelected ? "ring-2 ring-emerald-400 ring-offset-1 rounded-lg" : ""
                  }`}
                  style={{
                    height: `${Math.max(pct, 4)}%`,
                    background: d.calories === 0
                      ? "rgba(0,0,0,0.05)"
                      : isOver
                        ? "linear-gradient(to top, #ef4444, #f87171)"
                        : "linear-gradient(to top, #10b981, #34d399)",
                  }}
                >
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 hidden group-hover:block">
                    <span className="text-[9px] font-bold text-gray-500 whitespace-nowrap">
                      {d.calories > 0 ? d.calories : "—"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex gap-1.5 mt-1.5">
            {weeklyCalories.map((d) => (
              <div key={d.date} className="flex-1 text-center">
                <span className={`text-[9px] font-medium ${d.date === date ? "text-emerald-600" : "text-gray-400"}`}>
                  {format(parseISO(d.date), "EEE", { locale: fr }).charAt(0).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
          {/* Goal line indicator */}
          <div className="flex justify-between mt-2 text-[10px] text-gray-400">
            <span>Objectif: {goal} kcal/j</span>
            {daysWithData > 1 && (
              <span className={rollingAvg <= goal ? "text-emerald-500" : "text-red-500"}>
                {rollingAvg <= goal ? "Deficit moyen respecte" : "Surplus moyen detecte"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Meals grouped by type */}
      {loadingMeals ? (
        <div className="glass p-12 text-center">
          <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin-slow mx-auto" />
        </div>
      ) : (
        <div className="space-y-5">
          {mealsByType.map(({ type, label, icon: Icon, pill, meals: typeMeals }) => {
            const sectionTotal = typeMeals.reduce((s, m) => s + m.total_calories, 0);

            return (
              <div key={type} className="animate-fade-in">
                {/* Section header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-700">{label}</h3>
                    {sectionTotal > 0 && (
                      <span className={`pill ${pill} text-[10px]`}>
                        {Math.round(sectionTotal)} kcal
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/analyze?date=${date}`}
                    className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 hover:text-emerald-500 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </Link>
                </div>

                {/* Meals */}
                {typeMeals.length === 0 ? (
                  <Link
                    href={`/analyze?date=${date}`}
                    className="card p-4 flex items-center justify-center gap-2 text-gray-400 hover:text-emerald-500 hover:border-emerald-200 transition-all border border-dashed border-gray-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Ajouter</span>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    {typeMeals.map((meal) => {
                      const isEditing = editingMealId === meal.id;

                      return (
                        <div key={meal.id} className={`card p-4 ${isEditing ? "ring-2 ring-emerald-400 ring-offset-1" : "card-hover"}`}>
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xs text-gray-400 font-medium">
                              {format(new Date(meal.created_at), "HH:mm")}
                            </span>
                            <div className="flex items-center gap-1">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={cancelEditMeal}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={saveEditMeal}
                                    disabled={savingEdit || editFoodItems.length === 0}
                                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500 hover:text-emerald-600 transition-all"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditMeal(meal)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-all"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteMeal(meal.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {isEditing ? (
                            /* Edit mode */
                            <div className="mb-2 space-y-2">
                              {editFoodItems.map((item, j) => (
                                <div
                                  key={item.id || j}
                                  className="flex items-center gap-2 py-2 px-2 rounded-lg bg-white/50 border border-gray-100"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate">{item.name}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <button
                                        onClick={() => updateEditItem(j, Math.max(1, item.quantity - (item.unit === "g" || item.unit === "ml" ? 10 : 1)))}
                                        className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                      >
                                        <Minus className="w-3 h-3 text-gray-600" />
                                      </button>
                                      <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateEditItem(j, Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-14 text-center text-xs font-bold bg-white rounded px-1.5 py-0.5 border border-gray-200"
                                      />
                                      <span className="text-[10px] text-gray-400">{item.unit}</span>
                                      <button
                                        onClick={() => updateEditItem(j, item.quantity + (item.unit === "g" || item.unit === "ml" ? 10 : 1))}
                                        className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                      >
                                        <Plus className="w-3 h-3 text-gray-600" />
                                      </button>
                                    </div>
                                  </div>
                                  <span className="text-xs font-semibold text-gray-500">{Math.round(item.calories)} kcal</span>
                                  <button
                                    onClick={() => removeEditItem(j)}
                                    className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              {editFoodItems.length === 0 && (
                                <p className="text-xs text-gray-400 text-center py-2">Aucun aliment — le repas sera vide</p>
                              )}
                            </div>
                          ) : (
                            /* View mode */
                            meal.food_items && meal.food_items.length > 0 && (
                              <div className="mb-2 space-y-0.5">
                                {meal.food_items.map((item, j) => (
                                  <div
                                    key={item.id || j}
                                    className="flex justify-between text-sm py-1 px-1"
                                  >
                                    <span className="text-gray-700 font-medium">
                                      {item.name}
                                      <span className="text-gray-400 font-normal ml-1 text-xs">
                                        {item.quantity}{item.unit}
                                      </span>
                                    </span>
                                    <span className="text-gray-500 font-semibold text-xs">
                                      {Math.round(item.calories)} kcal
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )
                          )}

                          <div className="flex gap-3 text-xs font-semibold pt-2 border-t border-gray-100/50">
                            {isEditing ? (
                              <>
                                <span className="pill-green pill">
                                  {Math.round(editFoodItems.reduce((s, f) => s + f.calories, 0))} kcal
                                </span>
                                <span className="text-blue-500">
                                  P: {Math.round(editFoodItems.reduce((s, f) => s + f.protein, 0))}g
                                </span>
                                <span className="text-orange-500">
                                  G: {Math.round(editFoodItems.reduce((s, f) => s + f.carbs, 0))}g
                                </span>
                                <span className="text-purple-500">
                                  L: {Math.round(editFoodItems.reduce((s, f) => s + f.fat, 0))}g
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="pill-green pill">
                                  {Math.round(meal.total_calories)} kcal
                                </span>
                                <span className="text-blue-500">
                                  P: {Math.round(meal.total_protein)}g
                                </span>
                                <span className="text-orange-500">
                                  G: {Math.round(meal.total_carbs)}g
                                </span>
                                <span className="text-purple-500">
                                  L: {Math.round(meal.total_fat)}g
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
