import React from 'react';
import { useStore } from '../store';

export const OpeningAnimation: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-900 dark:to-purple-900 animate-fade-in">
      <div className="w-32 h-32 sm:w-40 sm:h-40 animate-scale-in">
        <svg viewBox="0 0 512 512" className="w-full h-full filter drop-shadow-lg">
          <defs>
            <linearGradient id="capGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            
            <linearGradient id="tasselGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <g transform="translate(256, 256)" className="animate-float">
            <g transform="translate(0, -40)" className="animate-bounce-in">
              <path
                d="M-100,0 L100,0 L60,-20 L-60,-20 Z"
                fill="url(#capGradient)"
                filter="url(#glow)"
                className="animate-pulse"
              />
              <path
                d="M-60,-20 L60,-20 L80,20 L-80,20 Z"
                fill="url(#capGradient)"
                filter="url(#glow)"
                className="animate-pulse"
              />
              <circle
                cx="-70"
                cy="0"
                r="10"
                fill="url(#tasselGradient)"
                filter="url(#glow)"
                className="animate-swing"
              />
              <path
                d="M-70,0 Q-80,20 -75,40 T-85,60"
                stroke="url(#tasselGradient)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                filter="url(#glow)"
                className="animate-swing"
              />
              <path
                d="M-85,60 L-95,80 L-75,80 Z"
                fill="url(#tasselGradient)"
                filter="url(#glow)"
                className="animate-swing"
              />
            </g>

            <g transform="translate(0, 40)" className="animate-slide-up">
              <path
                d="M-80,-20 C-80,-80 80,-80 80,-20"
                stroke="url(#capGradient)"
                strokeWidth="20"
                strokeLinecap="round"
                fill="none"
                filter="url(#glow)"
                className="animate-pulse"
              />

              <g transform="translate(-80, -20)" className="animate-glow">
                <circle 
                  cx="0" 
                  cy="0" 
                  r="30" 
                  fill="url(#capGradient)" 
                  filter="url(#glow)"
                />
                <circle cx="0" cy="0" r="20" fill="#1E293B"/>
                <circle cx="0" cy="0" r="12" fill="#3B82F6"/>
              </g>
              
              <g transform="translate(80, -20)" className="animate-glow">
                <circle 
                  cx="0" 
                  cy="0" 
                  r="30" 
                  fill="url(#capGradient)" 
                  filter="url(#glow)"
                />
                <circle cx="0" cy="0" r="20" fill="#1E293B"/>
                <circle cx="0" cy="0" r="12" fill="#3B82F6"/>
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};