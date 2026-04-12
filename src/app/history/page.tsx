"use client";

import { useState, useEffect, useCallback } from "react";
import { useProfiles } from "@/lib/hooks";
import type { Meal } from "@/lib/types";
import ProfileSelector from "@/components/ProfileSelector";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, TrendingDown, TrendingUp, Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const { profiles, activeProfile, activeProfileId, setActiveProfileId } =
    useProfiles();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<"week" | "month">("week");

  const fetchMeals = useCallback(async () => {
    if (!activeProfileId) return;
    setLoading(true);
    const today = new Date();
    const from =
      range === "week"
        ? format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
        : format(subDays(today, 30), "yyyy-MM-dd");
    const to =
      range === "week"
        ? format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
        : format(today, "yyyy-MM-dd");
    const res = await fetch(
      `/api/meals?profile_id=${activeProfileId}&from=${from}&to=${to}`
    );
    const data = await res.json();
    setMeals(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [activeProfileId, range]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const deleteMeal = async (id: string) => {
    await fetch("/api/meals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchMeals();
  };

  // Group meals by date
  const grouped = meals.reduce<Record<string, Meal[]>>((acc, meal) => {
    const d = meal.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(meal);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const mealTypeLabels: Record<string, string> = {
    breakfast: "Petit-dej",
    lunch: "Dejeuner",
    dinner: "Diner",
    snack: "Snack",
  };

  const mealTypePills: Record<string, string> = {
    breakfast: "pill-amber",
    lunch: "pill-blue",
    dinner: "pill-purple",
    snack: "pill-pink",
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="float-orb w-64 h-64 bg-emerald-200 top-10 -right-20" />

      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Historique
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            Consultez vos repas passes
          </p>
        </div>
        <ProfileSelector
          profiles={profiles}
          activeProfileId={activeProfileId}
          onSelect={setActiveProfileId}
        />
      </div>

      {/* Range tabs */}
      <div className="glass-strong inline-flex gap-1 p-1.5 rounded-2xl mb-6 animate-fade-in">
        {(["week", "month"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              range === r
                ? "gradient-green text-white shadow-lg shadow-green-500/20"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
            }`}
          >
            {r === "week" ? "Cette semaine" : "30 jours"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass p-16 text-center">
          <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin-slow mx-auto" />
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="glass p-16 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">
            Aucun repas sur cette periode
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date, dateIdx) => {
            const dayMeals = grouped[date];
            const dayTotal = dayMeals.reduce(
              (acc, m) => ({
                calories: acc.calories + m.total_calories,
                protein: acc.protein + m.total_protein,
                carbs: acc.carbs + m.total_carbs,
                fat: acc.fat + m.total_fat,
              }),
              { calories: 0, protein: 0, carbs: 0, fat: 0 }
            );
            const goal = activeProfile?.daily_calories_goal || 2000;
            const deficit = goal - dayTotal.calories;

            return (
              <div
                key={date}
                className="animate-fade-in"
                style={{ animationDelay: `${dateIdx * 80}ms` }}
              >
                {/* Day header - clickable to navigate to dashboard */}
                <Link
                  href={`/?date=${date}`}
                  className="glass-strong flex items-center justify-between p-4 mb-2 hover:ring-2 hover:ring-emerald-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${deficit > 0 ? "bg-emerald-400" : "bg-red-400"}`}
                    />
                    <h3 className="font-bold text-gray-800 capitalize">
                      {format(new Date(date), "EEEE d MMMM", { locale: fr })}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-700">
                      {Math.round(dayTotal.calories)} kcal
                    </span>
                    <span
                      className={`pill ${deficit > 0 ? "pill-green" : "pill-red"}`}
                    >
                      {deficit > 0 ? (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      )}
                      {deficit > 0 ? "-" : "+"}
                      {Math.abs(Math.round(deficit))}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </Link>

                {/* Day meals */}
                <div className="space-y-2 pl-4">
                  {dayMeals.map((meal) => (
                    <div key={meal.id} className="card p-3.5 card-hover">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span
                            className={`pill ${mealTypePills[meal.meal_type] || "pill-green"} shrink-0`}
                          >
                            {mealTypeLabels[meal.meal_type] || meal.meal_type}
                          </span>
                          <span className="text-sm text-gray-600 truncate">
                            {meal.food_items?.map((f) => f.name).join(", ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className="text-sm font-bold text-gray-700">
                            {Math.round(meal.total_calories)} kcal
                          </span>
                          <button
                            onClick={() => deleteMeal(meal.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-2 text-[11px] font-medium text-gray-400">
                        <span className="text-blue-400">
                          P: {Math.round(meal.total_protein)}g
                        </span>
                        <span className="text-orange-400">
                          G: {Math.round(meal.total_carbs)}g
                        </span>
                        <span className="text-purple-400">
                          L: {Math.round(meal.total_fat)}g
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
