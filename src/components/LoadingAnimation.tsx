import React from 'react';

export const LoadingAnimation: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-900 dark:to-purple-900">
      <div className="w-32 h-32 sm:w-40 sm:h-40 relative animate-float">
        <svg viewBox="0 0 512 512" className="w-full h-full filter drop-shadow-lg">
          <defs>
            <linearGradient id="loadingCapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA">
                <animate
                  attributeName="stop-color"
                  values="#60A5FA; #3B82F6; #60A5FA"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#3B82F6">
                <animate
                  attributeName="stop-color"
                  values="#3B82F6; #60A5FA; #3B82F6"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
            
            <linearGradient id="loadingTasselGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B">
                <animate
                  attributeName="stop-color"
                  values="#F59E0B; #D97706; #F59E0B"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#D97706">
                <animate
                  attributeName="stop-color"
                  values="#D97706; #F59E0B; #D97706"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>

            <filter id="loadingGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            <filter id="loadingShadow">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.25"/>
            </filter>
          </defs>

          <g transform="translate(256, 256)" className="animate-float">
            <g transform="translate(0, -40)" className="animate-bounce-in">
              <path
                d="M-100,0 L100,0 L60,-20 L-60,-20 Z"
                fill="url(#loadingCapGradient)"
                filter="url(#loadingGlow)"
              >
                <animate
                  attributeName="d"
                  values="M-100,0 L100,0 L60,-20 L-60,-20 Z;M-102,0 L102,0 L62,-22 L-62,-22 Z;M-100,0 L100,0 L60,-20 L-60,-20 Z"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="filter"
                  values="url(#loadingGlow);url(#loadingShadow);url(#loadingGlow)"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>

              <path
                d="M-60,-20 L60,-20 L80,20 L-80,20 Z"
                fill="url(#loadingCapGradient)"
                filter="url(#loadingGlow)"
              >
                <animate
                  attributeName="d"
                  values="M-60,-20 L60,-20 L80,20 L-80,20 Z;M-62,-22 L62,-22 L82,22 L-82,22 Z;M-60,-20 L60,-20 L80,20 L-80,20 Z"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="filter"
                  values="url(#loadingGlow);url(#loadingShadow);url(#loadingGlow)"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>

              <circle
                cx="-70"
                cy="0"
                r="10"
                fill="url(#loadingTasselGradient)"
                filter="url(#loadingGlow)"
              >
                <animate
                  attributeName="r"
                  values="10;12;10"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0,0,0;5,0,0;0,0,0;-5,0,0;0,0,0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>

              <path
                d="M-70,0 Q-80,20 -75,40 T-85,60"
                stroke="url(#loadingTasselGradient)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                filter="url(#loadingGlow)"
              >
                <animate
                  attributeName="d"
                  values="M-70,0 Q-80,20 -75,40 T-85,60;M-70,0 Q-60,20 -65,40 T-75,60;M-70,0 Q-80,20 -75,40 T-85,60"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>

              <path
                d="M-85,60 L-95,80 L-75,80 Z"
                fill="url(#loadingTasselGradient)"
                filter="url(#loadingGlow)"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0,-85,60;10,-85,60;0,-85,60;-10,-85,60;0,-85,60"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>
            </g>

            <g transform="translate(0, 40)" className="animate-slide-up">
              <path
                d="M-80,-20 C-80,-80 80,-80 80,-20"
                stroke="url(#loadingCapGradient)"
                strokeWidth="20"
                strokeLinecap="round"
                fill="none"
                filter="url(#loadingGlow)"
              >
                <animate
                  attributeName="d"
                  values="M-80,-20 C-80,-80 80,-80 80,-20;M-80,-22 C-80,-82 80,-82 80,-22;M-80,-20 C-80,-80 80,-80 80,-20"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>

              <g transform="translate(-80, -20)" className="animate-glow">
                <circle 
                  cx="0" 
                  cy="0" 
                  r="30" 
                  fill="url(#loadingCapGradient)" 
                  filter="url(#loadingGlow)"
                >
                  <animate
                    attributeName="r"
                    values="30;32;30"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="0" cy="0" r="20" fill="#1E293B"/>
                <circle cx="0" cy="0" r="12" fill="#3B82F6">
                  <animate
                    attributeName="r"
                    values="12;14;12"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
              
              <g transform="translate(80, -20)" className="animate-glow">
                <circle 
                  cx="0" 
                  cy="0" 
                  r="30" 
                  fill="url(#loadingCapGradient)" 
                  filter="url(#loadingGlow)"
                >
                  <animate
                    attributeName="r"
                    values="30;32;30"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="0" cy="0" r="20" fill="#1E293B"/>
                <circle cx="0" cy="0" r="12" fill="#3B82F6">
                  <animate
                    attributeName="r"
                    values="12;14;12"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            </g>
          </g>
        </svg>

        <div className="absolute inset-x-0 -bottom-12 flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <div className="text-white/90 font-medium tracking-wider animate-pulse">
            Loading...
          </div>
        </div>
      </div>
    </div>
  );
};