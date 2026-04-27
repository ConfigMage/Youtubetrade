"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentMember } from "./CurrentMemberContext";

export default function Header() {
  const { members, currentMember, setCurrentMemberId, loading } = useCurrentMember();
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/showcase", label: "My Showcase" },
    { href: "/trades", label: "Trades" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3 shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-xl font-bold text-trade-700 whitespace-nowrap">
            🎬 Video Trade
          </Link>

          {/* Mobile member selector */}
          <div className="sm:hidden flex items-center gap-2">
            {currentMember && (
              <span className="text-2xl" aria-hidden>
                {currentMember.avatarEmoji}
              </span>
            )}
            <select
              value={currentMember?.id ?? ""}
              onChange={(e) => setCurrentMemberId(parseInt(e.target.value, 10))}
              disabled={loading || members.length === 0}
              className="border border-stone-300 rounded-lg px-2 py-1 text-sm bg-white"
              aria-label="Select family member"
            >
              {members.length === 0 ? (
                <option value="">No members</option>
              ) : (
                members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          {navLinks.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-trade-100 text-trade-800"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {currentMember?.isAdmin && (
            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                pathname.startsWith("/admin")
                  ? "bg-trade-100 text-trade-800"
                  : "text-stone-700 hover:bg-stone-100"
              }`}
            >
              Admin
            </Link>
          )}

          {/* Desktop member selector */}
          <div className="hidden sm:flex items-center gap-2 ml-2 pl-2 border-l border-stone-200">
            {currentMember && (
              <span className="text-2xl" aria-hidden>
                {currentMember.avatarEmoji}
              </span>
            )}
            <select
              value={currentMember?.id ?? ""}
              onChange={(e) => setCurrentMemberId(parseInt(e.target.value, 10))}
              disabled={loading || members.length === 0}
              className="border border-stone-300 rounded-lg px-2 py-1 text-sm bg-white"
              aria-label="Select family member"
            >
              {members.length === 0 ? (
                <option value="">No members</option>
              ) : (
                members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </nav>
      </div>
    </header>
  );
}
