"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FamilyMember } from "@/types";

type CurrentMemberContextValue = {
  members: FamilyMember[];
  currentMember: FamilyMember | null;
  setCurrentMemberId: (id: number) => void;
  refreshMembers: () => Promise<void>;
  loading: boolean;
};

const CurrentMemberContext = createContext<CurrentMemberContextValue | null>(null);

const STORAGE_KEY = "video-trade:current-member-id";

export function CurrentMemberProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [currentMemberId, setCurrentMemberIdState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/members");
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data: FamilyMember[] = await res.json();
      setMembers(data);
    } catch (err) {
      console.error("Failed to load members", err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMembers();
  }, [refreshMembers]);

  // Hydrate the selected ID from localStorage on first mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const id = parseInt(stored, 10);
      if (!Number.isNaN(id)) setCurrentMemberIdState(id);
    }
  }, []);

  // If we have members loaded but no selection (or stored selection no longer
  // exists), default to the first member.
  useEffect(() => {
    if (members.length === 0) return;
    const exists = members.some((m) => m.id === currentMemberId);
    if (!exists) {
      const fallback = members[0];
      setCurrentMemberIdState(fallback.id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, String(fallback.id));
      }
    }
  }, [members, currentMemberId]);

  const setCurrentMemberId = useCallback((id: number) => {
    setCurrentMemberIdState(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(id));
    }
  }, []);

  const currentMember = useMemo(
    () => members.find((m) => m.id === currentMemberId) ?? null,
    [members, currentMemberId]
  );

  const value = useMemo(
    () => ({
      members,
      currentMember,
      setCurrentMemberId,
      refreshMembers,
      loading,
    }),
    [members, currentMember, setCurrentMemberId, refreshMembers, loading]
  );

  return (
    <CurrentMemberContext.Provider value={value}>
      {children}
    </CurrentMemberContext.Provider>
  );
}

export function useCurrentMember() {
  const ctx = useContext(CurrentMemberContext);
  if (!ctx) {
    throw new Error("useCurrentMember must be used inside CurrentMemberProvider");
  }
  return ctx;
}
