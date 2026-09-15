"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  initialQuery?: string;
  className?: string;
}

export function SearchBar({ initialQuery = "", className = "" }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery || urlQuery);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);

  if (prevUrlQuery !== urlQuery) {
    setPrevUrlQuery(urlQuery);
    setQuery(urlQuery);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = query.trim();
    if (clean) {
      router.push(`/?q=${encodeURIComponent(clean)}`);
    } else {
      router.push("/");
    }
  }

  function handleClear() {
    setQuery("");
    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} className={`relative w-full ${className}`}>
      <label htmlFor="search-books" className="sr-only">
        Search publications by title, keywords, topic, or category
      </label>

      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-mute pointer-events-none flex items-center justify-center">
          <Search className="w-4 h-4" />
        </div>

        <input
          id="search-books"
          name="q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search technical guides, topics, architectures..."
          autoComplete="off"
          spellCheck="false"
          className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-hairline hover:border-hairline-strong focus:border-ink focus:ring-1 focus:ring-ink rounded-lg text-ink placeholder:text-mute shadow-2xs transition-all outline-hidden"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search query"
            className="absolute right-3 p-1 rounded-md text-mute hover:text-ink transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </form>
  );
}
