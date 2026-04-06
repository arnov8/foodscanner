"use client";

import { useState, useRef } from "react";
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
  ChevronDown,
  Sparkles,
  ScanLine,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AnalyzePage() {
  const router = useRouter();
  const { profiles, activeProfileId, setActiveProfileId } = useProfiles();
  const [image, setImage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mealType, setMealType] = useState<string>("lunch");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
    if (!image) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mimeType }),
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

  const saveMeal = async () => {
    if (!result || !activeProfileId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: activeProfileId,
          meal_type: mealType,
          date: new Date().toISOString().split("T")[0],
          total_calories: result.total_calories,
          total_protein: result.total_protein,
          total_carbs: result.total_carbs,
          total_fat: result.total_fat,
          food_items: result.foods,
        }),
      });
      if (res.ok) router.push("/");
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
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      {/* Background orbs */}
      <div className="float-orb w-72 h-72 bg-emerald-200 -top-20 right-0" />
      <div className="float-orb w-48 h-48 bg-orange-200 bottom-40 -left-10" />

      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Scanner
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            Analysez votre repas par photo
          </p>
        </div>
        <ProfileSelector
          profiles={profiles}
          activeProfileId={activeProfileId}
          onSelect={setActiveProfileId}
        />
      </div>

      {!preview ? (
        /* Upload zone */
        <div className="glass p-10 animate-scale-in">
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
              <div className="w-28 h-28 gradient-green rounded-3xl flex items-center justify-center shadow-xl shadow-green-500/25 animate-float">
                <ScanLine className="w-14 h-14 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 gradient-orange rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Scannez votre assiette
              </h2>
              <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
                L&apos;IA identifie chaque aliment et calcule les valeurs
                nutritionnelles automatiquement
              </p>
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
      ) : (
        <div className="space-y-4 animate-fade-in">
          {/* Image preview */}
          <div className="glass overflow-hidden relative">
            <img
              src={preview}
              alt="Repas"
              className="w-full h-72 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <button
              onClick={reset}
              className="absolute top-4 right-4 glass p-2.5 rounded-xl hover:bg-white/80 transition-all"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Meal type */}
          <div className="glass p-5">
            <label className="text-sm font-bold text-gray-700 mb-3 block">
              Type de repas
            </label>
            <div className="relative">
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full appearance-none input-glass px-4 py-3.5 pr-10 font-medium"
              >
                <option value="breakfast">Petit-dejeuner</option>
                <option value="lunch">Dejeuner</option>
                <option value="dinner">Diner</option>
                <option value="snack">Snack</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Analyze button */}
          {!result && (
            <button
              onClick={analyze}
              disabled={analyzing}
              className={`${analyzing ? "btn-secondary" : "btn-primary"} w-full flex items-center justify-center gap-3`}
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyse en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Lancer l&apos;analyse IA</span>
                </>
              )}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="glass p-5 border-l-4 border-l-red-400 animate-scale-in">
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
            <div className="space-y-4 animate-scale-in">
              {/* Totals */}
              <div className="glass p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 gradient-green rounded-lg flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800">
                    Analyse terminee
                  </h3>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    {
                      label: "Calories",
                      value: Math.round(result.total_calories),
                      unit: "kcal",
                      gradient: "gradient-green",
                      shadow: "shadow-green-500/20",
                    },
                    {
                      label: "Prot.",
                      value: Math.round(result.total_protein),
                      unit: "g",
                      gradient: "gradient-blue",
                      shadow: "shadow-blue-500/20",
                    },
                    {
                      label: "Gluc.",
                      value: Math.round(result.total_carbs),
                      unit: "g",
                      gradient: "gradient-orange",
                      shadow: "shadow-orange-500/20",
                    },
                    {
                      label: "Lip.",
                      value: Math.round(result.total_fat),
                      unit: "g",
                      gradient: "gradient-purple",
                      shadow: "shadow-purple-500/20",
                    },
                  ].map(({ label, value, unit, gradient, shadow }) => (
                    <div
                      key={label}
                      className={`${gradient} rounded-2xl p-3 text-white text-center shadow-lg ${shadow}`}
                    >
                      <p className="text-xl font-bold">{value}</p>
                      <p className="text-[10px] opacity-80 font-medium">
                        {unit} {label.toLowerCase()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Food items */}
              <div className="glass p-5">
                <h3 className="font-bold text-gray-800 mb-4">
                  Aliments detectes
                </h3>
                <div className="space-y-1">
                  {result.foods.map((food, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-3 px-3 rounded-xl hover:bg-white/50 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">
                          {food.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {food.quantity} {food.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-700">
                          {Math.round(food.calories)} kcal
                        </p>
                        <div className="flex gap-2 text-[10px] text-gray-400 font-medium mt-0.5">
                          <span className="text-blue-400">
                            P:{Math.round(food.protein)}g
                          </span>
                          <span className="text-orange-400">
                            G:{Math.round(food.carbs)}g
                          </span>
                          <span className="text-purple-400">
                            L:{Math.round(food.fat)}g
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={reset} className="btn-secondary flex-1">
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
      )}
    </div>
  );
}
