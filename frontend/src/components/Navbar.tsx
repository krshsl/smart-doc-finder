import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import * as Switch from "@radix-ui/react-switch";
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState<string>(searchParams.get("q") || "");
  const [aiSearch, setAiSearch] = useState<boolean>(
    searchParams.get("ai") === "1",
  );

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    setAiSearch(searchParams.get("ai") === "1");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (query.trim()) {
      const basePath = aiSearch ? "/search/ai" : "/search";
      const searchUrl = `${basePath}?q=${encodeURIComponent(query.trim())}${
        aiSearch ? "&ai=1" : ""
      }`;
      navigate(searchUrl);
    }
  };

  return (
    <header className="flex-shrink-0 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 shadow-sm border border-gray-200"
          >
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />

            <input
              id="search"
              name="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus:outline-none text-gray-900 placeholder:text-gray-400 sm:text-sm"
              placeholder="Search for files and folders"
              type="search"
            />

            <div className="w-px h-6 bg-gray-200 mx-3" />

            <div className="flex items-center gap-2 relative mr-1">
              {aiSearch && (
                <>
                  <span className="absolute -top-1.5 rotate-3 -left-2.5 text-blue-500 text-xs animate-sparkle">
                    ✦
                  </span>
                  <span className="absolute -bottom-1.5 -rotate-6 -right-2 text-pink-500 text-[10px] animate-sparkle [animation-delay:0.75s]">
                    ✦
                  </span>
                </>
              )}

              <span
                className={`text-xs font-medium whitespace-nowrap transition-colors ${
                  aiSearch ? "text-blue-600" : "text-gray-600"
                }`}
              >
                {aiSearch ? "AI On" : "AI Off"}
              </span>
              <Switch.Root
                className={`relative w-[40px] h-[22px] rounded-full border transition-colors duration-200 ${
                  aiSearch
                    ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 border-purple-50"
                    : "bg-gray-200 border-gray-300"
                }`}
                id="ai-search"
                checked={aiSearch}
                onCheckedChange={(checked: boolean) => setAiSearch(checked)}
              >
                <Switch.Thumb
                  className={`block w-[18px] h-[18px] bg-white rounded-full shadow transform transition-transform duration-200 ${
                    aiSearch ? "translate-x-[18px]" : "translate-x-[2px]"
                  }`}
                />
              </Switch.Root>
            </div>
          </form>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
