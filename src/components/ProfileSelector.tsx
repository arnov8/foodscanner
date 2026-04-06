"use client";

import type { Profile } from "@/lib/types";
import { User } from "lucide-react";

interface Props {
  profiles: Profile[];
  activeProfileId: string | null;
  onSelect: (id: string) => void;
}

export default function ProfileSelector({
  profiles,
  activeProfileId,
  onSelect,
}: Props) {
  if (profiles.length === 0) return null;

  return (
    <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl">
      <div className="w-7 h-7 gradient-green rounded-lg flex items-center justify-center">
        <User className="w-3.5 h-3.5 text-white" />
      </div>
      <select
        value={activeProfileId || ""}
        onChange={(e) => onSelect(e.target.value)}
        className="text-sm font-semibold bg-transparent text-gray-700 focus:outline-none cursor-pointer pr-2"
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
