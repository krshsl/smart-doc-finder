import { ChevronRightIcon, HomeIcon } from "@heroicons/react/20/solid";
import React from "react";
import { Link } from "react-router-dom";

import { Breadcrumb } from "../types";

export const Breadcrumbs: React.FC<{ crumbs: Breadcrumb[] }> = ({ crumbs }) => {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-2">
        <li>
          <Link
            to="/my-cloud"
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <HomeIcon className="h-5 w-5 flex-shrink-0" />
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.id}>
            <div className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-[hsl(var(--muted-foreground))]" />
              <Link
                to={`/my-cloud/${crumb.id}`}
                className="ml-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                {crumb.name}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};
