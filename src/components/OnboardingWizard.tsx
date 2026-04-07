"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  Beef,
  Wheat,
  Droplets,
  Target,
} from "lucide-react";

interface OnboardingData {
  name: string;
  sex: "male" | "female";
  age: number;
  weight: number;
  height: number;
  activity: number;
  deficit: number;
}

interface Goals {
  daily_calories_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fat_goal: number;
  tdee: number;
}

function calculateGoals(data: OnboardingData): Goals {
  // Mifflin-St Jeor formula
  let bmr: number;
  if (data.sex === "male") {
    bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age + 5;
  } else {
    bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age - 161;
  }

  const tdee = Math.round(bmr * data.activity);
  const targetCalories = Math.max(1200, tdee - data.deficit);

  // Macro split: 30% protein, 40% carbs, 30% fat
  const proteinCals = targetCalories * 0.3;
  const carbsCals = targetCalories * 0.4;
  const fatCals = targetCalories * 0.3;

  return {
    daily_calories_goal: Math.round(targetCalories),
    daily_protein_goal: Math.round(proteinCals / 4),
    daily_carbs_goal: Math.round(carbsCals / 4),
    daily_fat_goal: Math.round(fatCals / 9),
    tdee,
  };
}

const STEPS = [
  { title: "Prenom", subtitle: "Comment vous appelez-vous ?" },
  { title: "Sexe", subtitle: "Pour calculer votre metabolisme" },
  { title: "Age", subtitle: "En annees" },
  { title: "Poids", subtitle: "En kilogrammes" },
  { title: "Taille", subtitle: "En centimetres" },
  { title: "Activite", subtitle: "Votre niveau d'activite physique" },
  { title: "Objectif", subtitle: "Quel deficit calorique visez-vous ?" },
  { title: "Resultats", subtitle: "Vos objectifs personnalises" },
];

const ACTIVITY_LEVELS = [
  { value: 1.2, label: "Sedentaire", desc: "Peu ou pas d'exercice, travail de bureau" },
  { value: 1.375, label: "Legerement actif", desc: "Exercice leger 1-3 fois/semaine" },
  { value: 1.55, label: "Moderement actif", desc: "Exercice modere 3-5 fois/semaine" },
  { value: 1.725, label: "Tres actif", desc: "Exercice intense 6-7 fois/semaine" },
  { value: 1.9, label: "Extremement actif", desc: "Exercice tres intense, travail physique" },
];

const DEFICIT_OPTIONS = [
  { value: 250, label: "Leger", desc: "~0.25 kg/semaine", color: "pill-green" },
  { value: 500, label: "Modere", desc: "~0.5 kg/semaine", color: "pill-orange" },
  { value: 750, label: "Agressif", desc: "~0.75 kg/semaine", color: "pill-red" },
];

interface Props {
  onComplete: (profile: {
    name: string;
    daily_calories_goal: number;
    daily_protein_goal: number;
    daily_carbs_goal: number;
    daily_fat_goal: number;
  }) => void;
  onCancel: () => void;
}

export default function OnboardingWizard({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: "",
    sex: "male",
    age: 30,
    weight: 75,
    height: 175,
    activity: 1.375,
    deficit: 500,
  });

  const goals = calculateGoals(data);

  const canNext = () => {
    if (step === 0) return data.name.trim().length > 0;
    if (step === 2) return data.age > 0 && data.age < 120;
    if (step === 3) return data.weight > 20 && data.weight < 300;
    if (step === 4) return data.height > 100 && data.height < 250;
    return true;
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSave = async () => {
    setSaving(true);
    await onComplete({
      name: data.name,
      daily_calories_goal: goals.daily_calories_goal,
      daily_protein_goal: goals.daily_protein_goal,
      daily_carbs_goal: goals.daily_carbs_goal,
      daily_fat_goal: goals.daily_fat_goal,
    });
    setSaving(false);
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="glass p-6 animate-scale-in">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-500">
            Etape {step + 1}/{STEPS.length}
          </span>
          <span className="text-xs font-medium text-gray-400">
            {STEPS[step].title}
          </span>
        </div>
        <div className="stat-bar h-2">
          <div
            className="stat-bar-fill gradient-green"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {STEPS[step].subtitle}
        </h2>
      </div>

      {/* Step content */}
      <div className="min-h-[200px] mb-6">
        {/* Step 0: Name */}
        {step === 0 && (
          <div className="animate-fade-in">
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="Votre prenom..."
              className="w-full input-glass text-2xl font-bold text-gray-800 text-center py-6"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && canNext() && next()}
            />
          </div>
        )}

        {/* Step 1: Sex */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
            {[
              { value: "male" as const, label: "Homme", emoji: "👨" },
              { value: "female" as const, label: "Femme", emoji: "👩" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setData({ ...data, sex: option.value });
                  next();
                }}
                className={`glass p-8 rounded-2xl text-center card-hover transition-all ${
                  data.sex === option.value
                    ? "ring-2 ring-emerald-400 ring-offset-2"
                    : ""
                }`}
              >
                <span className="text-4xl block mb-3">{option.emoji}</span>
                <span className="text-lg font-bold text-gray-800">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Age */}
        {step === 2 && (
          <div className="animate-fade-in text-center">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setData({ ...data, age: Math.max(10, data.age - 1) })}
                className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-2xl font-bold text-gray-600 hover:bg-white/70"
              >
                -
              </button>
              <input
                type="number"
                value={data.age}
                onChange={(e) =>
                  setData({ ...data, age: parseInt(e.target.value) || 0 })
                }
                className="w-28 input-glass text-4xl font-bold text-gray-800 text-center py-4"
              />
              <button
                onClick={() => setData({ ...data, age: Math.min(120, data.age + 1) })}
                className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-2xl font-bold text-gray-600 hover:bg-white/70"
              >
                +
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-3">ans</p>
          </div>
        )}

        {/* Step 3: Weight */}
        {step === 3 && (
          <div className="animate-fade-in text-center">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setData({ ...data, weight: Math.max(30, data.weight - 1) })}
                className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-2xl font-bold text-gray-600 hover:bg-white/70"
              >
                -
              </button>
              <input
                type="number"
                value={data.weight}
                onChange={(e) =>
                  setData({ ...data, weight: parseInt(e.target.value) || 0 })
                }
                className="w-28 input-glass text-4xl font-bold text-gray-800 text-center py-4"
              />
              <button
                onClick={() => setData({ ...data, weight: Math.min(300, data.weight + 1) })}
                className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-2xl font-bold text-gray-600 hover:bg-white/70"
              >
                +
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-3">kg</p>
          </div>
        )}

        {/* Step 4: Height */}
        {step === 4 && (
          <div className="animate-fade-in text-center">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setData({ ...data, height: Math.max(100, data.height - 1) })}
                className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-2xl font-bold text-gray-600 hover:bg-white/70"
              >
                -
              </button>
              <input
                type="number"
                value={data.height}
                onChange={(e) =>
                  setData({ ...data, height: parseInt(e.target.value) || 0 })
                }
                className="w-28 input-glass text-4xl font-bold text-gray-800 text-center py-4"
              />
              <button
                onClick={() => setData({ ...data, height: Math.min(250, data.height + 1) })}
                className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-2xl font-bold text-gray-600 hover:bg-white/70"
              >
                +
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-3">cm</p>
          </div>
        )}

        {/* Step 5: Activity */}
        {step === 5 && (
          <div className="space-y-2 animate-fade-in">
            {ACTIVITY_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => {
                  setData({ ...data, activity: level.value });
                  next();
                }}
                className={`w-full glass p-4 rounded-2xl text-left card-hover transition-all ${
                  data.activity === level.value
                    ? "ring-2 ring-emerald-400 ring-offset-2"
                    : ""
                }`}
              >
                <p className="font-bold text-gray-800">{level.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{level.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 6: Deficit */}
        {step === 6 && (
          <div className="space-y-3 animate-fade-in">
            <div className="glass p-4 rounded-2xl mb-4 text-center">
              <p className="text-xs text-gray-400 mb-1">
                Votre depense calorique quotidienne (TDEE)
              </p>
              <p className="text-3xl font-bold text-gray-800">
                {goals.tdee} <span className="text-base text-gray-400">kcal/jour</span>
              </p>
            </div>
            <p className="text-sm font-bold text-gray-600 mb-2">
              Choisissez votre rythme de perte :
            </p>
            {DEFICIT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setData({ ...data, deficit: option.value });
                  next();
                }}
                className={`w-full glass p-4 rounded-2xl text-left card-hover transition-all ${
                  data.deficit === option.value
                    ? "ring-2 ring-emerald-400 ring-offset-2"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800">{option.label}</p>
                      <span className={`pill ${option.color}`}>
                        -{option.value} kcal
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{option.desc}</p>
                  </div>
                  <p className="text-lg font-bold text-gray-700">
                    {Math.max(1200, goals.tdee - option.value)} kcal
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 7: Results */}
        {step === 7 && (
          <div className="animate-fade-in space-y-4">
            <div className="glass-dark p-5 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-5 h-5 text-emerald-300" />
                <span className="text-sm text-emerald-200 font-medium">
                  Objectif quotidien
                </span>
              </div>
              <p className="text-4xl font-bold text-white">
                {goals.daily_calories_goal}
                <span className="text-lg text-emerald-200 ml-1">kcal</span>
              </p>
              <p className="text-xs text-emerald-300 mt-2">
                TDEE {goals.tdee} kcal - deficit {data.deficit} kcal
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: Beef,
                  label: "Proteines",
                  value: goals.daily_protein_goal,
                  unit: "g",
                  gradient: "gradient-blue",
                  shadow: "shadow-blue-500/20",
                },
                {
                  icon: Wheat,
                  label: "Glucides",
                  value: goals.daily_carbs_goal,
                  unit: "g",
                  gradient: "gradient-orange",
                  shadow: "shadow-orange-500/20",
                },
                {
                  icon: Droplets,
                  label: "Lipides",
                  value: goals.daily_fat_goal,
                  unit: "g",
                  gradient: "gradient-purple",
                  shadow: "shadow-purple-500/20",
                },
              ].map(({ icon: Icon, label, value, unit, gradient, shadow }) => (
                <div
                  key={label}
                  className={`${gradient} rounded-2xl p-4 text-white text-center shadow-lg ${shadow}`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1 opacity-80" />
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-[10px] opacity-80">
                    {unit} {label.toLowerCase()}
                  </p>
                </div>
              ))}
            </div>

            <div className="glass p-4 rounded-2xl">
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong>Repartition :</strong> 30% proteines, 40% glucides, 30%
                lipides. Basee sur la formule Mifflin-St Jeor. Vous pouvez
                ajuster ces objectifs plus tard dans les parametres.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={prev} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        )}
        {step === 0 && (
          <button onClick={onCancel} className="btn-secondary">
            Annuler
          </button>
        )}
        <div className="flex-1" />
        {step < 7 && step !== 1 && step !== 5 && step !== 6 && (
          <button
            onClick={next}
            disabled={!canNext()}
            className="btn-primary flex items-center gap-2"
          >
            Suivant
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {step === 7 && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 pulse-glow"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            Creer mon profil
          </button>
        )}
      </div>
    </div>
  );
}
