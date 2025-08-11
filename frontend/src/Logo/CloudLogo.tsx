import React from "react";

const CloudLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    height="32"
    width="32"
    viewBox="110 180 320 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="50%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>

    <path
      fill="url(#grad1)"
      stroke="#000000"
      strokeWidth={0.002}
      d="M150,350
         C120,300,170,250,220,270
         C250,200,340,200,360,270
         C420,270,430,330,400,350
         Z"
    />
  </svg>
);

export default CloudLogo;
