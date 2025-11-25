"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { VoiceSearchButton } from "./voice-search-button";

type Props = {
  placeholder?: string;
  defaultValue?: string;
  className?: string;
};

export function SearchBar({ placeholder = "Search creators, tags, or films", defaultValue = "", className = "" }: Props) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  // Update query when defaultValue changes (e.g., from URL)
  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  const performSearch = useCallback((searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  }, [router]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleVoiceTranscript = (transcript: string) => {
    const trimmedTranscript = transcript.trim();
    setQuery(trimmedTranscript);
    
    // Auto-submit after voice input with a small delay to ensure state is updated
    if (trimmedTranscript) {
      // Use setTimeout to ensure state update completes before navigation
      setTimeout(() => {
        performSearch(trimmedTranscript);
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch(query);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-1 items-center gap-2 ${className}`}
    >
      <div className="flex w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/60 sm:px-4 sm:py-2">
        <button
          type="submit"
          className="flex-shrink-0 text-white/60 hover:text-white transition-colors cursor-pointer touch-manipulation"
          aria-label="Search"
          title="Click to search"
        >
          <Search className="size-4" />
        </button>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
        />
        <VoiceSearchButton onTranscript={handleVoiceTranscript} />
      </div>
    </form>
  );
}

