"use client";

import { useState, useEffect, useCallback } from "react";
import type { Profile } from "./types";

const PROFILE_KEY = "food-analyzer-profile-id";
const ADMIN_PROFILE_KEY = "food-analyzer-admin-profile-id";

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [adminProfileId, setAdminProfileIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async (viewerId?: string) => {
    const params = viewerId ? `?viewer_id=${viewerId}` : "";
    const res = await fetch(`/api/profiles${params}`);
    const data = await res.json();
    setProfiles(data);
    setLoading(false);
    return data as Profile[];
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    const savedAdmin = localStorage.getItem(ADMIN_PROFILE_KEY);
    if (savedAdmin) setAdminProfileIdState(savedAdmin);
    if (saved) setActiveProfileIdState(saved);
    fetchProfiles(saved || undefined).then((data) => {
      if (!saved && data.length > 0) {
        setActiveProfileIdState(data[0].id);
        localStorage.setItem(PROFILE_KEY, data[0].id);
      }
      // Auto-detect and persist admin profile ID on first load
      if (!savedAdmin) {
        const initialId = saved || data[0]?.id;
        const activeP = data.find((p: Profile) => p.id === initialId);
        if (activeP?.is_admin) {
          setAdminProfileIdState(activeP.id);
          localStorage.setItem(ADMIN_PROFILE_KEY, activeP.id);
        }
      }
    });
  }, [fetchProfiles]);

  const setActiveProfileId = (id: string) => {
    setActiveProfileIdState(id);
    localStorage.setItem(PROFILE_KEY, id);
    // If switching to an admin profile, record it as the admin anchor
    const selectedProfile = profiles.find((p) => p.id === id);
    if (selectedProfile?.is_admin) {
      setAdminProfileIdState(id);
      localStorage.setItem(ADMIN_PROFILE_KEY, id);
    }
    fetchProfiles(id);
  };

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;

  return {
    profiles,
    activeProfile,
    activeProfileId,
    adminProfileId,
    setActiveProfileId,
    loading,
    refetch: () => fetchProfiles(activeProfileId || undefined),
  };
}
