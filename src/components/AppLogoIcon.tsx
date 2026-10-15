import React from 'react'

interface AppLogoIconProps {
  className?: string
}

export function AppLogoIcon({ className = 'w-8 h-8' }: AppLogoIconProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="hi-bg"
          x1="0"
          y1="0"
          x2="128"
          y2="128"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#292524" />
          <stop offset="100%" stopColor="#141210" />
        </linearGradient>
        <linearGradient
          id="hi-gold"
          x1="20"
          y1="16"
          x2="108"
          y2="112"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient
          id="hi-emerald"
          x1="64"
          y1="24"
          x2="112"
          y2="108"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      {/* Squircle Base */}
      <rect
        x="4"
        y="4"
        width="120"
        height="120"
        rx="32"
        fill="url(#hi-bg)"
        stroke="#44403C"
        strokeWidth="3"
      />

      {/* Dong Son Concentric Halo */}
      <circle
        cx="64"
        cy="64"
        r="46"
        stroke="#A8A29E"
        strokeOpacity="0.28"
        strokeWidth="2"
        strokeDasharray="3 4"
      />

      {/* Left Half: Warm Gold Sun Star & Mountain */}
      <polygon
        points="42,32 45,39.5 52.5,42.5 45,45.5 42,53 39,45.5 31.5,42.5 39,39.5"
        fill="url(#hi-gold)"
      />
      <path
        d="M 22 88 L 42 64 L 58 80 L 64 73 L 64 96 L 26 96 C 23.8 96 22 94.2 22 92 Z"
        fill="url(#hi-gold)"
      />

      {/* Right Half: Optimized Emerald Peak & Sparkle */}
      <path
        d="M 64 73 L 82 52 L 106 84 L 106 92 C 106 94.2 104.2 96 102 96 L 64 96 Z"
        fill="url(#hi-emerald)"
      />
      <path
        d="M 86 28 L 88.8 35.4 L 96 38 L 88.8 40.6 L 86 48 L 83.2 40.6 L 76 38 L 83.2 35.4 Z"
        fill="#6EE7B7"
      />

      {/* Split Slider Divider Line & Knob */}
      <line
        x1="64"
        y1="20"
        x2="64"
        y2="108"
        stroke="#FAF9F5"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle
        cx="64"
        cy="64"
        r="11"
        fill="#FAF9F5"
        stroke="#18181B"
        strokeWidth="2.5"
      />
    </svg>
  )
}
