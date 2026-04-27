"use client";

import { useRef } from "react";

type Props = {
  children: React.ReactNode;
};

export default function Carousel({ children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: amount * dir, behavior: "smooth" });
  }

  return (
    <div className="relative group">
      <div
        ref={scrollRef}
        className="carousel-scroll flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: "thin" }}
      >
        {children}
      </div>
      {/* Desktop scroll buttons (touch handles it on mobile) */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Scroll left"
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-9 h-9 rounded-full bg-white shadow-md border border-stone-200 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Scroll right"
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-9 h-9 rounded-full bg-white shadow-md border border-stone-200 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ›
      </button>
    </div>
  );
}
