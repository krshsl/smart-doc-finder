import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import * as Switch from "@radix-ui/react-switch";
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState<string>(searchParams.get("q") || "");
  const [aiSearch, setAiSearch] = useState<boolean>(
    window.location.pathname.includes("/search/ai")
  );

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    setAiSearch(window.location.pathname.includes("/search/ai"));
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (query.trim()) {
      const basePath = aiSearch ? "/search/ai" : "/search";
      const searchUrl = `${basePath}?q=${encodeURIComponent(query.trim())}`;
      navigate(searchUrl);
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setAiSearch(checked);
    if (query.trim()) {
      const basePath = checked ? "/search/ai" : "/search";
      const searchUrl = `${basePath}?q=${encodeURIComponent(query.trim())}`;
      navigate(searchUrl);
    }
  };

  return (
    <header className="flex-shrink-0 bg-white/75 backdrop-blur-lg border-b border-slate-200">
      <div className="flex h-20 items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-4 rounded-full bg-white px-5 py-3 shadow-md shadow-slate-200/50 border border-slate-200"
          >
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
            <input
              id="search"
              name="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-slate-800 placeholder:text-slate-400 text-base"
              placeholder="Search files, folders, or ask AI..."
              type="search"
            />
            <div className="w-px h-6 bg-slate-200" />
            <div className="flex items-center gap-2.5 relative">
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
              <label
                htmlFor="ai-search"
                className={`text-sm font-medium whitespace-nowrap transition-colors pr-1 ${
                  aiSearch ? "text-brand-600" : "text-slate-600"
                }`}
              >
                AI Search
              </label>
              <Switch.Root
                className={`relative w-[42px] h-[24px] rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                  aiSearch
                    ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                    : "bg-slate-300"
                }`}
                id="ai-search"
                checked={aiSearch}
                onCheckedChange={handleSwitchChange}
              >
                <Switch.Thumb
                  className={`block w-[20px] h-[20px] bg-white rounded-full shadow-lg transform transition-transform duration-200 ${
                    aiSearch ? "translate-x-[19px]" : "translate-x-[2px]"
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
