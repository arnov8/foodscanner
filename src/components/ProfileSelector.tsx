"use client";

import type { Profile } from "@/lib/types";
import { User, Shield, ArrowLeft } from "lucide-react";

interface Props {
  profiles: Profile[];
  activeProfileId: string | null;
  adminProfileId?: string | null;
  onSelect: (id: string) => void;
  onReturnToAdmin?: () => void;
}

export default function ProfileSelector({
  profiles,
  activeProfileId,
  adminProfileId,
  onSelect,
  onReturnToAdmin,
}: Props) {
  if (profiles.length === 0) return null;

  const isViewingOther = adminProfileId && activeProfileId && adminProfileId !== activeProfileId;
  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const isAdmin = activeProfile?.is_admin;

  return (
    <div className="flex items-center gap-2">
      {isViewingOther && onReturnToAdmin && (
        <button
          onClick={onReturnToAdmin}
          className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Mon profil
        </button>
      )}
      <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl">
        <div className={`w-7 h-7 ${isAdmin ? "gradient-orange" : "gradient-green"} rounded-lg flex items-center justify-center`}>
          {isAdmin ? (
            <Shield className="w-3.5 h-3.5 text-white" />
          ) : (
            <User className="w-3.5 h-3.5 text-white" />
          )}
        </div>
        <select
          value={activeProfileId || ""}
          onChange={(e) => onSelect(e.target.value)}
          className="text-sm font-semibold bg-transparent text-gray-700 focus:outline-none cursor-pointer pr-2"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}{p.is_admin ? " ★" : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
