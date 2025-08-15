import { Bars3Icon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import * as Switch from "@radix-ui/react-switch";
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";

const Navbar: React.FC<{ toggleSidebar: () => void }> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState<string>(searchParams.get("q") || "");
  const [aiSearch, setAiSearch] = useState<boolean>(
    location.pathname.includes("/search/ai")
  );

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    setAiSearch(location.pathname.includes("/search/ai"));
  }, [searchParams, location.pathname]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      const basePath = aiSearch ? "/search/ai" : "/search";
      const searchUrl = `${basePath}?q=${encodeURIComponent(query.trim())}`;
      navigate(searchUrl);
    }
  };

  return (
    <header className="flex h-20 flex-shrink-0 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 sm:px-6 lg:px-8">
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 -ml-2 text-[hsl(var(--muted-foreground))]"
        aria-label="Open sidebar"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      <div className="flex-1 flex justify-center lg:justify-start">
        <form
          onSubmit={handleSearch}
          className="flex w-full max-w-md items-center gap-3 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 py-2 shadow-sm"
        >
          <MagnifyingGlassIcon className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
          <input
            className="flex-1 bg-transparent border-none p-0 focus:ring-0 placeholder:text-[hsl(var(--muted-foreground))] text-sm outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files and folders..."
            type="search"
          />
          <div className="flex items-center gap-2 pl-3 border-l border-[hsl(var(--border))]">
            {aiSearch && (
              <div className="relative">
                <span className="absolute -top-4 [rotate:4deg] -left-0.5 text-lime-500 text-base animate-sparkle">
                  ✦
                </span>
                <span className="absolute bottom-[0.15rem] [rotate:-15deg] -right-[0.95rem] text-orange-500 text-xs animate-sparkle [animation-delay:0.75s]">
                  ✦
                </span>
              </div>
            )}
            <label
              htmlFor="ai-search"
              className={`text-xs font-medium whitespace-nowrap pr-1 transition-colors ${
                aiSearch
                  ? "bg-ai-luminous bg-clip-text text-transparent"
                  : "text-[hsl(var(--muted-foreground))]"
              }`}
            >
              AI
            </label>
            <Switch.Root
              className="relative flex items-center w-[40px] h-[24px] rounded-full border transition-colors duration-200 data-[state=checked]:border-0 data-[state=unchecked]:bg-[hsl(var(--input))] data-[state=checked]:bg-ai-luminous opacity-90"
              id="ai-search"
              checked={aiSearch}
              onCheckedChange={setAiSearch}
            >
              <Switch.Thumb
                className="
                  pointer-events-none block -ml-[0.075rem] h-[18px] w-[18px] transform rounded-full
                  shadow-lg ring-1 transition-all duration-200
                  data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1
                  shadow-black/20 ring-black/5
                  dark:shadow-black/40 dark:ring-white/10
                  data-[state=unchecked]:bg-[hsl(var(--foreground))]
                  data-[state=checked]:bg-white
                  dark:bg-[hsl(var(--foreground))]
                "
              />
            </Switch.Root>
          </div>
        </form>
      </div>
    </header>
  );
};

export default Navbar;
