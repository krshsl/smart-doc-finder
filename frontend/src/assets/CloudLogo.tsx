import React from "react";

const CloudLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" {...props}>
    <defs>
      <linearGradient id="aiLuminous" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#2e8b57" />
        <stop offset="33.34%" stopColor="#26a69a" />
        <stop offset="66.67%" stopColor="#ffaf00" />
        <stop offset="100%" stopColor="#ff8c00" />
      </linearGradient>
      <style>
        {`
          .stroke { stroke:#0f5132; stroke-width:12; stroke-linecap:round; stroke-linejoin:round; }
          .ink { fill:#0f5132; }
          .paper { fill:#ffffff; }
        `}
      </style>
    </defs>
    <g transform="translate(-54, -14)">
      <path
        fill="url(#aiLuminous)"
        d="M120 315 C120 265 160 225 215 230 C235 165 315 150 355 195 C400 185 435 215 445 255 C480 255 500 285 500 320 C500 360 470 390 430 390 H185 C145 390 120 355 120 315 Z"
        rx="40"
        ry="40"
      />
      <path
        className="stroke paper"
        d="M201 248 h110 l28 28 v128 a14 14 0 0 1 -14 14 h-124 a14 14 0 0 1 -14 -14 v-142 a14 14 0 0 1 14 -14 Z"
      />
      <path className="stroke paper" d="M311 248 L339 276 L311 276 Z" />
      <path className="stroke" d="M216 280 H270" />
      <path className="stroke" d="M216 304 H292" />
      <path className="stroke" d="M216 328 H280" />
      <path className="stroke" d="M216 352 H266" />
      <circle className="stroke paper" cx="360" cy="350" r="56" />
      <g transform="translate(360, 350) rotate(45)">
        <path
          className="stroke paper"
          d="M-11 56 h22 v84 a11 11 0 0 1 -22 0 z"
          fill="white"
          strokeLinecap="butt"
        />
      </g>
      <text
        x="360"
        y="355"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="Inter, system-ui, -apple-system, Arial, sans-serif"
        fontSize="52"
        fontWeight="900"
        className="ink"
      >
        AI
      </text>
    </g>
  </svg>
);

export default CloudLogo;
