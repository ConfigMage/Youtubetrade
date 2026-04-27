"use client";

import { useState } from "react";
import { useCurrentMember } from "@/components/layout/CurrentMemberContext";
import type { FamilyMember } from "@/types";

const AVATAR_PRESETS = [
  "🎬",
  "🎣",
  "🌸",
  "🐶",
  "🐱",
  "🦊",
  "🐻",
  "🐼",
  "🦄",
  "🚀",
  "🎸",
  "🍕",
  "🍩",
  "🌈",
  "⚽",
  "🏀",
  "🦖",
  "🧩",
  "🎮",
  "🌵",
];

export default function AdminPage() {
  const { currentMember, members, refreshMembers, loading } = useCurrentMember();

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <p className="text-stone-500">Loading…</p>
      </main>
    );
  }

  if (!currentMember?.isAdmin) {
    return (
      <main className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Admin</h1>
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Only admin members can manage the family. Switch to an admin user
          using the dropdown above.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Family Admin</h1>

      <AddMemberForm onAdded={refreshMembers} />

      <h2 className="text-lg font-semibold mt-8 mb-3">Members</h2>
      <ul className="space-y-2">
        {members.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            isSelf={m.id === currentMember.id}
            onChanged={refreshMembers}
          />
        ))}
      </ul>
    </main>
  );
}

function AddMemberForm({ onAdded }: { onAdded: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState(AVATAR_PRESETS[0]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, avatarEmoji, isAdmin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setName("");
      setEmail("");
      setIsAdmin(false);
      setAvatarEmoji(AVATAR_PRESETS[0]);
      await onAdded();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border-2 border-trade-200 bg-white p-4 sm:p-6 shadow-sm space-y-3"
    >
      <h2 className="text-lg font-semibold">Add a family member</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
          />
        </label>
      </div>
      <div>
        <p className="text-sm font-medium mb-1">Avatar emoji</p>
        <div className="flex flex-wrap gap-1">
          {AVATAR_PRESETS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setAvatarEmoji(e)}
              className={`text-xl rounded-lg w-9 h-9 flex items-center justify-center border-2 ${
                avatarEmoji === e
                  ? "border-trade-500 bg-trade-50"
                  : "border-transparent hover:border-stone-300"
              }`}
              aria-label={`Avatar ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isAdmin}
          onChange={(e) => setIsAdmin(e.target.checked)}
        />
        Admin (can manage the family)
      </label>
      {error && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
          {error}
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !name || !email}
          className="px-4 py-2 rounded-lg bg-trade-500 text-white text-sm font-medium hover:bg-trade-600 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add member"}
        </button>
      </div>
    </form>
  );
}

function MemberRow({
  member,
  isSelf,
  onChanged,
}: {
  member: FamilyMember;
  isSelf: boolean;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [avatarEmoji, setAvatarEmoji] = useState(member.avatarEmoji);
  const [isAdmin, setIsAdmin] = useState(member.isAdmin);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: member.id,
          name,
          email,
          avatarEmoji,
          isAdmin,
        }),
      });
      if (!res.ok) throw new Error();
      setEditing(false);
      await onChanged();
    } catch {
      alert("Failed to update member");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (
      !confirm(
        `Remove ${member.name}? Their cards, reactions, and trades will also be deleted.`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id }),
      });
      if (!res.ok) throw new Error();
      await onChanged();
    } catch {
      alert("Failed to remove member");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <li className="rounded-xl border-2 border-stone-200 bg-white p-3 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-1.5 text-sm"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {AVATAR_PRESETS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setAvatarEmoji(e)}
              className={`text-lg rounded-lg w-8 h-8 flex items-center justify-center border-2 ${
                avatarEmoji === e
                  ? "border-trade-500 bg-trade-50"
                  : "border-transparent hover:border-stone-300"
              }`}
              aria-label={`Avatar ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
          Admin
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-3 py-1.5 rounded-lg text-sm text-stone-600 hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg bg-trade-500 text-white text-sm font-medium hover:bg-trade-600 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-xl border-2 border-stone-200 bg-white p-3 flex items-center gap-3">
      <span className="text-2xl" aria-hidden>
        {member.avatarEmoji}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold">
          {member.name}
          {member.isAdmin && (
            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-trade-100 text-trade-800">
              admin
            </span>
          )}
          {isSelf && (
            <span className="ml-2 text-xs text-stone-500">(you)</span>
          )}
        </p>
        <p className="text-xs text-stone-500 truncate">{member.email}</p>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="px-3 py-1.5 rounded-lg text-sm text-stone-700 hover:bg-stone-100"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={busy || isSelf}
        title={isSelf ? "Can't remove yourself" : "Remove member"}
        className="px-3 py-1.5 rounded-lg text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        Remove
      </button>
    </li>
  );
}
