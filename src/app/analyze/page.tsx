"use client";

import { useState, useRef, Suspense } from "react";
import { useProfiles } from "@/lib/hooks";
import type { AnalysisResult } from "@/lib/types";
import ProfileSelector from "@/components/ProfileSelector";
import {
  Camera,
  Upload,
  Loader2,
  Check,
  X,
  RotateCcw,
  Sparkles,
  ScanLine,
  PenLine,
  Sun,
  UtensilsCrossed,
  Moon,
  Coffee,
  Trash2,
  Minus,
  Plus,
  CalendarDays,
  PlusCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const MEAL_TYPES = [
  { value: "breakfast", label: "Petit-dejeuner", icon: Coffee, color: "gradient-orange", shadow: "shadow-orange-500/20" },
  { value: "lunch", label: "Dejeuner", icon: Sun, color: "gradient-blue", shadow: "shadow-blue-500/20" },
  { value: "dinner", label: "Diner", icon: Moon, color: "gradient-purple", shadow: "shadow-purple-500/20" },
  { value: "snack", label: "Snack", icon: UtensilsCrossed, color: "gradient-green", shadow: "shadow-green-500/20" },
];

export default function AnalyzePageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-14 h-14 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin-slow" /></div>}>
      <AnalyzePage />
    </Suspense>
  );
}

function AnalyzePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profiles, activeProfileId, setActiveProfileId } = useProfiles();
  const [mealType, setMealType] = useState<string | null>(null);
  const [mode, setMode] = useState<"photo" | "text" | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [textInput, setTextInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Date selection - defaults to today or from URL param
  const initialDate = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
  const [mealDate, setMealDate] = useState(initialDate);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Add extra foods state
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [extraText, setExtraText] = useState("");
  const [analyzingExtra, setAnalyzingExtra] = useState(false);

  const handleFile = (file: File) => {
    setError(null);
    setResult(null);
    setMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      setImage(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!image && !textInput.trim()) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          image
            ? { image, mimeType }
            : { text: textInput.trim() }
        ),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch {
      setError("Erreur lors de l'analyse. Reessayez.");
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeExtra = async () => {
    if (!extraText.trim() || !result) return;
    setAnalyzingExtra(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extraText.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        // Merge new foods into existing result
        const mergedFoods = [...result.foods, ...data.foods];
        setResult({
          foods: mergedFoods,
          total_calories: mergedFoods.reduce((s, f) => s + f.calories, 0),
          total_protein: mergedFoods.reduce((s, f) => s + f.protein, 0),
          total_carbs: mergedFoods.reduce((s, f) => s + f.carbs, 0),
          total_fat: mergedFoods.reduce((s, f) => s + f.fat, 0),
        });
        setExtraText("");
        setShowAddExtra(false);
      }
    } catch {
      setError("Erreur lors de l'analyse complementaire.");
    } finally {
      setAnalyzingExtra(false);
    }
  };

  const saveMeal = async () => {
    if (!result || !activeProfileId || !mealType) return;
    setSaving(true);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: activeProfileId,
          meal_type: mealType,
          date: mealDate,
          total_calories: result.total_calories,
          total_protein: result.total_protein,
          total_carbs: result.total_carbs,
          total_fat: result.total_fat,
          food_items: result.foods,
        }),
      });
      if (res.ok) router.push(`/?date=${mealDate}`);
      else setError("Erreur lors de la sauvegarde");
    } catch {
      setError("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setImage(null);
    setPreview(null);
    setTextInput("");
    setResult(null);
    setError(null);
    setMode(null);
    setShowAddExtra(false);
    setExtraText("");
  };

  const fullReset = () => {
    reset();
    setMealType(null);
  };

  const updateFoodItem = (index: number, field: string, value: number) => {
    if (!result) return;
    const foods = [...result.foods];
    const item = { ...foods[index] };
    const ratio = field === "quantity" && item.quantity > 0 ? value / item.quantity : 1;

    if (field === "quantity") {
      item.quantity = value;
      item.calories = Math.round(item.calories * ratio);
      item.protein = Math.round(item.protein * ratio * 10) / 10;
      item.carbs = Math.round(item.carbs * ratio * 10) / 10;
      item.fat = Math.round(item.fat * ratio * 10) / 10;
    }

    foods[index] = item;
    setResult({
      foods,
      total_calories: foods.reduce((s, f) => s + f.calories, 0),
      total_protein: foods.reduce((s, f) => s + f.protein, 0),
      total_carbs: foods.reduce((s, f) => s + f.carbs, 0),
      total_fat: foods.reduce((s, f) => s + f.fat, 0),
    });
  };

  const removeFoodItem = (index: number) => {
    if (!result) return;
    const foods = result.foods.filter((_, i) => i !== index);
    if (foods.length === 0) {
      setResult(null);
      return;
    }
    setResult({
      foods,
      total_calories: foods.reduce((s, f) => s + f.calories, 0),
      total_protein: foods.reduce((s, f) => s + f.protein, 0),
      total_carbs: foods.reduce((s, f) => s + f.carbs, 0),
      total_fat: foods.reduce((s, f) => s + f.fat, 0),
    });
  };

  const selectedMeal = MEAL_TYPES.find((m) => m.value === mealType);

  const formattedDate = (() => {
    try {
      const d = parseISO(mealDate);
      const today = format(new Date(), "yyyy-MM-dd");
      if (mealDate === today) return "Aujourd'hui";
      return format(d, "EEEE d MMMM", { locale: fr });
    } catch {
      return mealDate;
    }
  })();

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="float-orb w-72 h-72 bg-emerald-200 -top-20 right-0" />
      <div className="float-orb w-48 h-48 bg-orange-200 bottom-40 -left-10" />

      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Ajouter un repas
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            Photo ou description texte
          </p>
        </div>
        <ProfileSelector
          profiles={profiles}
          activeProfileId={activeProfileId}
          onSelect={setActiveProfileId}
        />
      </div>

      {/* Date selector */}
      <div className="glass-strong flex items-center justify-center gap-3 mb-6 py-3 px-4 animate-fade-in">
        <CalendarDays className="w-4 h-4 text-gray-400" />
        <button
          onClick={() => dateInputRef.current?.showPicker()}
          className="text-sm font-semibold text-gray-700 hover:bg-white/50 rounded-xl px-3 py-1.5 transition-all capitalize"
        >
          {formattedDate}
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={mealDate}
          onChange={(e) => e.target.value && setMealDate(e.target.value)}
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
        />
        {mealDate !== format(new Date(), "yyyy-MM-dd") && (
          <button
            onClick={() => setMealDate(format(new Date(), "yyyy-MM-dd"))}
            className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all"
          >
            Aujourd&apos;hui
          </button>
        )}
      </div>

      {/* Step 1: Choose meal type */}
      {!mealType && (
        <div className="animate-scale-in">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Quel repas ajoutez-vous ?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {MEAL_TYPES.map(({ value, label, icon: Icon, color, shadow }) => (
              <button
                key={value}
                onClick={() => setMealType(value)}
                className="glass p-6 rounded-2xl text-center card-hover transition-all"
              >
                <div
                  className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg ${shadow}`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <p className="font-bold text-gray-800">{label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Choose input mode */}
      {mealType && !mode && !result && (
        <div className="animate-scale-in">
          {/* Selected meal badge */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={fullReset}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ← Changer
            </button>
            {selectedMeal && (
              <span className={`pill pill-green font-bold`}>
                {selectedMeal.label}
              </span>
            )}
          </div>

          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Comment voulez-vous ajouter ?
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode("photo")}
              className="glass p-8 rounded-2xl text-center card-hover"
            >
              <div className="w-16 h-16 gradient-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <p className="font-bold text-gray-800 mb-1">Photo</p>
              <p className="text-xs text-gray-400">
                Prenez ou importez une photo
              </p>
            </button>
            <button
              onClick={() => setMode("text")}
              className="glass p-8 rounded-2xl text-center card-hover"
            >
              <div className="w-16 h-16 gradient-orange rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/25">
                <PenLine className="w-8 h-8 text-white" />
              </div>
              <p className="font-bold text-gray-800 mb-1">Texte</p>
              <p className="text-xs text-gray-400">
                Decrivez votre repas
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Photo mode */}
      {mealType && mode === "photo" && !preview && !result && (
        <div className="animate-scale-in">
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setMode(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ← Retour
            </button>
            {selectedMeal && (
              <span className="pill pill-green font-bold">
                {selectedMeal.label}
              </span>
            )}
          </div>

          <div className="glass p-10">
            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 gradient-green rounded-3xl flex items-center justify-center shadow-xl shadow-green-500/25 animate-float">
                <ScanLine className="w-12 h-12 text-white" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Prendre une photo
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Importer
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleFile(e.target.files[0])
              }
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleFile(e.target.files[0])
              }
            />
          </div>
        </div>
      )}

      {/* Photo preview + analyze */}
      {mealType && mode === "photo" && preview && !result && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={reset}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ← Retour
            </button>
            {selectedMeal && (
              <span className="pill pill-green font-bold">
                {selectedMeal.label}
              </span>
            )}
          </div>

          <div className="glass overflow-hidden relative">
            <img src={preview} alt="Repas" className="w-full h-72 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <button
              onClick={reset}
              className="absolute top-4 right-4 glass p-2.5 rounded-xl hover:bg-white/80"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <button
            onClick={analyze}
            disabled={analyzing}
            className={`${analyzing ? "btn-secondary" : "btn-primary"} w-full flex items-center justify-center gap-3`}
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analyser la photo
              </>
            )}
          </button>
        </div>
      )}

      {/* Text mode */}
      {mealType && mode === "text" && !result && (
        <div className="space-y-4 animate-scale-in">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setMode(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ← Retour
            </button>
            {selectedMeal && (
              <span className="pill pill-green font-bold">
                {selectedMeal.label}
              </span>
            )}
          </div>

          <div className="glass p-5">
            <label className="text-sm font-bold text-gray-700 mb-3 block">
              Decrivez votre repas
            </label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Ex: Un steak hache avec des frites et une salade verte, un verre de coca..."
              rows={4}
              className="w-full input-glass text-base resize-none leading-relaxed"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-2">
              Soyez precis sur les quantites si possible (ex: 200g de pates, 2 oeufs...)
            </p>
          </div>

          <button
            onClick={analyze}
            disabled={analyzing || !textInput.trim()}
            className={`${analyzing ? "btn-secondary" : "btn-primary"} w-full flex items-center justify-center gap-3`}
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analyser avec l&apos;IA
              </>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass p-5 border-l-4 border-l-red-400 animate-scale-in mt-4">
          <p className="text-red-600 text-sm font-medium">{error}</p>
          <button
            onClick={() => {
              setError(null);
              analyze();
            }}
            className="text-red-500 text-sm font-semibold mt-2 flex items-center gap-1 hover:text-red-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reessayer
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-scale-in mt-4">
          <div className="flex items-center gap-2 mb-2">
            {selectedMeal && (
              <span className="pill pill-green font-bold">
                {selectedMeal.label}
              </span>
            )}
            <span className="pill pill-blue">
              {mode === "photo" ? "Photo" : "Texte"}
            </span>
          </div>

          {/* Totals */}
          <div className="glass p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 gradient-green rounded-lg flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-gray-800">Analyse terminee</h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Calories", value: Math.round(result.total_calories), unit: "kcal", gradient: "gradient-green", shadow: "shadow-green-500/20" },
                { label: "Prot.", value: Math.round(result.total_protein), unit: "g", gradient: "gradient-blue", shadow: "shadow-blue-500/20" },
                { label: "Gluc.", value: Math.round(result.total_carbs), unit: "g", gradient: "gradient-orange", shadow: "shadow-orange-500/20" },
                { label: "Lip.", value: Math.round(result.total_fat), unit: "g", gradient: "gradient-purple", shadow: "shadow-purple-500/20" },
              ].map(({ label, value, unit, gradient, shadow }) => (
                <div key={label} className={`${gradient} rounded-2xl p-3 text-white text-center shadow-lg ${shadow}`}>
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-[10px] opacity-80 font-medium">{unit} {label.toLowerCase()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Food items - editable */}
          <div className="glass p-5">
            <h3 className="font-bold text-gray-800 mb-1">Aliments detectes</h3>
            <p className="text-xs text-gray-400 mb-4">Modifiez les quantites ou supprimez les aliments incorrects</p>
            <div className="space-y-2">
              {result.foods.map((food, i) => (
                <div key={i} className="flex items-center gap-3 py-3 px-3 rounded-xl bg-white/30 border border-white/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{food.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => updateFoodItem(i, "quantity", Math.max(1, food.quantity - (food.unit === "g" || food.unit === "ml" ? 10 : 1)))}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3 text-gray-600" />
                      </button>
                      <input
                        type="number"
                        value={food.quantity}
                        onChange={(e) => updateFoodItem(i, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center text-sm font-bold bg-white/60 rounded-lg px-2 py-1 border border-gray-200"
                      />
                      <span className="text-xs text-gray-400 font-medium">{food.unit}</span>
                      <button
                        onClick={() => updateFoodItem(i, "quantity", food.quantity + (food.unit === "g" || food.unit === "ml" ? 10 : 1))}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3 text-gray-600" />
                      </button>
                    </div>
                    <div className="flex gap-2 text-[10px] text-gray-400 font-medium mt-1">
                      <span className="text-blue-400">P:{Math.round(food.protein)}g</span>
                      <span className="text-orange-400">G:{Math.round(food.carbs)}g</span>
                      <span className="text-purple-400">L:{Math.round(food.fat)}g</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-700 text-sm">{Math.round(food.calories)} kcal</p>
                  </div>
                  <button
                    onClick={() => removeFoodItem(i)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add forgotten foods */}
            {!showAddExtra ? (
              <button
                onClick={() => setShowAddExtra(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-300 text-gray-400 hover:text-emerald-500 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Ajouter un aliment oublie</span>
              </button>
            ) : (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <label className="text-sm font-bold text-gray-700 mb-2 block">
                  Decrivez les aliments oublies
                </label>
                <textarea
                  value={extraText}
                  onChange={(e) => setExtraText(e.target.value)}
                  placeholder="Ex: un yaourt nature, une pomme, un cafe avec du lait..."
                  rows={2}
                  className="w-full input-glass text-sm resize-none leading-relaxed"
                  autoFocus
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => { setShowAddExtra(false); setExtraText(""); }}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={analyzeExtra}
                    disabled={analyzingExtra || !extraText.trim()}
                    className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
                  >
                    {analyzingExtra ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analyse...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Analyser et ajouter
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={fullReset} className="btn-secondary flex-1">
              Annuler
            </button>
            <button
              onClick={saveMeal}
              disabled={saving || !activeProfileId}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
