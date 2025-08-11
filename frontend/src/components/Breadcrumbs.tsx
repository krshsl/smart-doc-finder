import { ChevronRightIcon, HomeIcon } from "@heroicons/react/20/solid";
import React from "react";
import { Link } from "react-router-dom";

import { Breadcrumb } from "../types";

interface BreadcrumbsProps {
  crumbs: Breadcrumb[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ crumbs }) => {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-2">
        <li>
          <div>
            <Link
              to="/my-cloud"
              className="text-slate-400 hover:text-slate-500"
            >
              <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="sr-only">Home</span>
            </Link>
          </div>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.id}>
            <div className="flex items-center">
              <ChevronRightIcon
                className="h-5 w-5 flex-shrink-0 text-slate-400"
                aria-hidden="true"
              />
              <Link
                to={`/my-cloud/${crumb.id}`}
                className="ml-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:underline"
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
