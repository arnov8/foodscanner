"use client";

import { useState, useEffect, useCallback } from "react";
import { useProfiles } from "@/lib/hooks";
import type { Meal } from "@/lib/types";
import ProfileSelector from "@/components/ProfileSelector";
import CalorieRing from "@/components/CalorieRing";
import Link from "next/link";
import {
  Camera,
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
} from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { fr } from "date-fns/locale";

const MEAL_SECTIONS = [
  { type: "breakfast", label: "Petit-dejeuner", icon: Coffee, pill: "pill-amber" },
  { type: "lunch", label: "Dejeuner", icon: Sun, pill: "pill-blue" },
  { type: "dinner", label: "Diner", icon: Moon, pill: "pill-purple" },
  { type: "snack", label: "Snack", icon: UtensilsCrossed, pill: "pill-pink" },
];

export default function Dashboard() {
  const {
    profiles,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    loading,
  } = useProfiles();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loadingMeals, setLoadingMeals] = useState(false);

  const fetchMeals = useCallback(async () => {
    if (!activeProfileId) return;
    setLoadingMeals(true);
    const res = await fetch(
      `/api/meals?profile_id=${activeProfileId}&date=${date}`
    );
    const data = await res.json();
    setMeals(Array.isArray(data) ? data : []);
    setLoadingMeals(false);
  }, [activeProfileId, date]);

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
          onSelect={setActiveProfileId}
        />
      </div>

      {/* Date picker */}
      <div className="glass-strong flex items-center justify-center gap-4 mb-6 py-3 px-6 animate-fade-in">
        <button
          onClick={() =>
            setDate(format(subDays(new Date(date), 1), "yyyy-MM-dd"))
          }
          className="p-2 rounded-xl hover:bg-white/60 transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="text-base font-semibold text-gray-700 min-w-[200px] text-center capitalize">
          {format(new Date(date), "EEEE d MMMM", { locale: fr })}
        </span>
        <button
          onClick={() =>
            setDate(format(addDays(new Date(date), 1), "yyyy-MM-dd"))
          }
          className="p-2 rounded-xl hover:bg-white/60 transition-all"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
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
                    href="/analyze"
                    className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 hover:text-emerald-500 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </Link>
                </div>

                {/* Meals */}
                {typeMeals.length === 0 ? (
                  <Link
                    href="/analyze"
                    className="card p-4 flex items-center justify-center gap-2 text-gray-400 hover:text-emerald-500 hover:border-emerald-200 transition-all border border-dashed border-gray-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Ajouter</span>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    {typeMeals.map((meal) => (
                      <div key={meal.id} className="card p-4 card-hover">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-gray-400 font-medium">
                            {format(new Date(meal.created_at), "HH:mm")}
                          </span>
                          <button
                            onClick={() => deleteMeal(meal.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {meal.food_items && meal.food_items.length > 0 && (
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
                        )}

                        <div className="flex gap-3 text-xs font-semibold pt-2 border-t border-gray-100/50">
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
                        </div>
                      </div>
                    ))}
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
