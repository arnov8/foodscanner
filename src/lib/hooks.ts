"use client";

import { useState, useEffect, useCallback } from "react";
import type { Profile } from "./types";

const PROFILE_KEY = "food-analyzer-profile-id";

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    const res = await fetch("/api/profiles");
    const data = await res.json();
    setProfiles(data);
    setLoading(false);
    return data as Profile[];
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) setActiveProfileIdState(saved);
    fetchProfiles().then((data) => {
      if (!saved && data.length > 0) {
        setActiveProfileIdState(data[0].id);
        localStorage.setItem(PROFILE_KEY, data[0].id);
      }
    });
  }, [fetchProfiles]);

  const setActiveProfileId = (id: string) => {
    setActiveProfileIdState(id);
    localStorage.setItem(PROFILE_KEY, id);
  };

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;

  return {
    profiles,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    loading,
    refetch: fetchProfiles,
  };
}
