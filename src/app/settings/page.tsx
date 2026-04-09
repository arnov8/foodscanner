"use client";

import { useState } from "react";
import { useProfiles } from "@/lib/hooks";
import type { Profile } from "@/lib/types";
import OnboardingWizard from "@/components/OnboardingWizard";
import {
  UserPlus,
  Save,
  Trash2,
  User,
  Target,
  Loader2,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Key,
} from "lucide-react";

export default function SettingsPage() {
  const { profiles, refetch } = useProfiles();
  const [editing, setEditing] = useState<Profile | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    daily_calories_goal: 2000,
    daily_protein_goal: 150,
    daily_carbs_goal: 250,
    daily_fat_goal: 65,
    claude_api_key: "" as string | null,
  });

  const startCreate = () => {
    setEditing(null);
    setCreating(true);
  };

  const startEdit = (profile: Profile) => {
    setCreating(false);
    setEditing(profile);
    setForm({
      name: profile.name,
      daily_calories_goal: profile.daily_calories_goal,
      daily_protein_goal: profile.daily_protein_goal,
      daily_carbs_goal: profile.daily_carbs_goal,
      daily_fat_goal: profile.daily_fat_goal,
      claude_api_key: profile.claude_api_key,
    });
  };

  const handleWizardComplete = async (profile: {
    name: string;
    daily_calories_goal: number;
    daily_protein_goal: number;
    daily_carbs_goal: number;
    daily_fat_goal: number;
  }) => {
    await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    await refetch();
    setCreating(false);
  };

  const saveProfile = async () => {
    if (!editing) return;
    setSaving(true);
    await fetch("/api/profiles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, ...form }),
    });
    await refetch();
    setEditing(null);
    setSaving(false);
  };

  const deleteProfile = async (id: string) => {
    if (!confirm("Supprimer ce profil et tous ses repas ?")) return;
    await fetch("/api/profiles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await refetch();
    if (editing?.id === id) setEditing(null);
  };

  const goalFields = [
    {
      key: "daily_calories_goal" as const,
      label: "Calories",
      unit: "kcal/jour",
      icon: Flame,
      gradient: "gradient-green",
    },
    {
      key: "daily_protein_goal" as const,
      label: "Proteines",
      unit: "g/jour",
      icon: Beef,
      gradient: "gradient-blue",
    },
    {
      key: "daily_carbs_goal" as const,
      label: "Glucides",
      unit: "g/jour",
      icon: Wheat,
      gradient: "gradient-orange",
    },
    {
      key: "daily_fat_goal" as const,
      label: "Lipides",
      unit: "g/jour",
      icon: Droplets,
      gradient: "gradient-purple",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="float-orb w-72 h-72 bg-emerald-200 -top-20 -right-20" />
      <div className="float-orb w-48 h-48 bg-orange-200 bottom-20 -left-10" />

      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Profils
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            Gerez les profils et objectifs
          </p>
        </div>
        {!creating && (
          <button
            onClick={startCreate}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Nouveau
          </button>
        )}
      </div>

      {/* Onboarding wizard for new profiles */}
      {creating && (
        <div className="mb-8">
          <OnboardingWizard
            onComplete={handleWizardComplete}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {/* Profiles list */}
      {!creating && (
        <div className="space-y-3 mb-8">
          {profiles.map((profile, i) => (
            <div
              key={profile.id}
              onClick={() => startEdit(profile)}
              className={`glass p-5 cursor-pointer card-hover animate-fade-in ${
                editing?.id === profile.id
                  ? "ring-2 ring-emerald-400 ring-offset-2"
                  : ""
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-green rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">
                      {profile.name}
                    </p>
                    <div className="flex gap-3 text-xs font-medium mt-1">
                      <span className="pill-green pill">
                        {profile.daily_calories_goal} kcal
                      </span>
                      <span className="text-blue-400">
                        P:{profile.daily_protein_goal}g
                      </span>
                      <span className="text-orange-400">
                        G:{profile.daily_carbs_goal}g
                      </span>
                      <span className="text-purple-400">
                        L:{profile.daily_fat_goal}g
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProfile(profile.id);
                  }}
                  className="p-2.5 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          {profiles.length === 0 && (
            <div className="glass p-16 text-center animate-scale-in">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium mb-2">Aucun profil</p>
              <p className="text-sm text-gray-400 mb-6">
                Creez votre premier profil pour commencer le suivi
              </p>
              <button onClick={startCreate} className="btn-primary">
                Creer un profil
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit form (existing profiles only) */}
      {editing && (
        <div className="glass p-6 animate-scale-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 gradient-green rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Modifier {editing.name}
              </h2>
              <p className="text-xs text-gray-400">
                Ajustez les objectifs quotidiens
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                Nom du profil
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full input-glass text-lg font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {goalFields.map(({ key, label, unit, icon: Icon, gradient }) => (
                <div key={key} className="glass p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`w-7 h-7 ${gradient} rounded-lg flex items-center justify-center`}
                    >
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-600">
                      {label}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={form[key]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [key]: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full input-glass text-xl font-bold text-gray-800"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 font-medium">
                    {unit}
                  </p>
                </div>
              ))}
            </div>

            {/* API Key field - only for profiles that have one (non-grandfathered) */}
            {editing.claude_api_key !== null && (
              <div className="glass p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 gradient-purple rounded-lg flex items-center justify-center">
                    <Key className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-gray-600">
                    Cle API Claude
                  </span>
                </div>
                <input
                  type="password"
                  value={form.claude_api_key || ""}
                  onChange={(e) =>
                    setForm({ ...form, claude_api_key: e.target.value })
                  }
                  placeholder="sk-ant-api03-..."
                  className="w-full input-glass text-sm font-mono"
                />
                <p className="text-[10px] text-gray-400 mt-1 font-medium">
                  Necessaire pour les analyses IA
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={saveProfile}
                disabled={saving || !form.name.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
