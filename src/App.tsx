import React, { useState, useEffect } from 'react';
import { StudentList } from './components/StudentList';
import BluetoothManager from './components/BluetoothManager';
import { ClassSelector } from './components/ClassSelector';
import { Settings } from './components/Settings';
import { VoiceRecognition } from './components/VoiceRecognition';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Notifications } from './components/Notifications';
import { OpeningAnimation } from './components/OpeningAnimation';
import { LoadingAnimation } from './components/LoadingAnimation';
import { useStore } from './store';
import { toast } from 'react-hot-toast';

const Logo = () => {
  const { isTracking, startTracking, stopTracking, currentSectionId } = useStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  const [statusMessage, setStatusMessage] = useState('Click logo to start tracking');
  const [showOpening, setShowOpening] = useState(false);

  useEffect(() => {
    if (isTracking) {
      setStatusMessage('Recording participation');
    } else {
      setStatusMessage('Click logo to start tracking');
    }
  }, [isTracking]);

  const handleLogoClick = async (e: React.MouseEvent) => {
    if (!currentSectionId) {
      toast.error('Please select a section first');
      return;
    }

    setShowOpening(true);
    setTimeout(() => setShowOpening(false), 2000);

    // Calculate ripple position relative to click
    const rect = e.currentTarget.getBoundingClientRect();
    setRipplePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    setIsAnimating(true);
    setShowRipple(true);

    try {
      if (!isTracking) {
        setIsStarting(true);
        await startTracking();
        setStatusMessage('Recording participation');
      } else {
        setIsStarting(false);
        await stopTracking();
        setStatusMessage('Click logo to start tracking');
      }
    } catch (error) {
      console.error('Error toggling tracking:', error);
      toast.error('Failed to toggle recording. Please try again or refresh the page.');
      // Reset tracking state to ensure consistency
      if (isTracking) {
        try {
          await stopTracking();
        } catch (e) {
          console.error('Failed to reset tracking state:', e);
        }
      }
    } finally {
      // Reset animation states regardless of success/failure
      setTimeout(() => {
        setIsAnimating(false);
        setIsStarting(false);
        setShowRipple(false);
      }, 1500);
    }
  };

  return (
    <>
      {showOpening && <OpeningAnimation />}
      <div className="flex items-center gap-4">
        <div 
          className="relative cursor-pointer group"
          onClick={handleLogoClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          role="button"
          tabIndex={0}
          aria-label={isTracking ? "Stop tracking" : "Start tracking"}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleLogoClick(e as any);
            }
          }}
        >
          <img 
            src="/logo1.png" 
            alt="Student Participation Tracker Logo"
            className={`h-12 sm:h-16 w-auto transition-all duration-300 ${
              isAnimating ? 'animate-icon-open' : 
              isTracking ? 'animate-icon-pulse animate-glow-pulse' : 
              isHovered ? 'scale-105 brightness-110' : ''
            }`}
            aria-hidden="true"
          />

          {isTracking && (
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 animate-fade-in">
              <div className="relative w-3 h-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 border-2 border-green-500 dark:border-green-400 rounded-full animate-ping"
                    style={{
                      animationDelay: `${i * 0.5}s`,
                      opacity: 0.3
                    }}
                  />
                ))}
                <div className="absolute inset-0 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
              </div>
            </div>
          )}

          {showRipple && (
            <div 
              className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"
              style={{
                clipPath: 'circle(200% at 50% 50%)'
              }}
            >
              <div 
                className="absolute bg-blue-500/20 rounded-full animate-ripple"
                style={{
                  width: '8px',
                  height: '8px',
                  left: ripplePosition.x - 4,
                  top: ripplePosition.y - 4
                }}
              />
            </div>
          )}

          {isHovered && !isAnimating && (
            <div className="absolute inset-0 bg-blue-500/10 rounded-full transition-all duration-300" />
          )}

          {isStarting && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm rounded-full animate-pulse" />
            </div>
          )}
        </div>

        <div className="animate-fade-slide-in animation-delay-200">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Student Participation Tracker
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {statusMessage}
          </p>
        </div>
      </div>
    </>
  );
};

const App: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const { settings } = useStore();

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setShowLoading(false);
      setIsLoaded(true);
    }, 2000);

    const initializeTheme = () => {
      if (settings.theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', isDark);
      } else {
        document.documentElement.classList.toggle('dark', settings.theme === 'dark');
      }
    };

    initializeTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      if (settings.theme === 'system') {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [settings.theme]);

  if (showLoading) {
    return <LoadingAnimation />;
  }

  return (
    <div 
      className={`min-h-screen bg-gray-100 dark:bg-dark-900 transition-all duration-500 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* VoiceRecognition component moved to BluetoothManager */}
      <header className="bg-white dark:bg-dark-800 shadow animate-fade-slide-in relative z-50 safe-top">
        <div className="max-w-7xl mx-auto py-2 sm:py-4 px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
            <Logo />
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="animate-slide-in-right animation-delay-300 relative z-50">
                <Settings />
              </div>
              <div className="animate-slide-in-right animation-delay-400">
                <ClassSelector />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8 relative z-0 safe-bottom">
        <div className="animate-fade-slide-in animation-delay-500">
          <StudentList />
        </div>
        <BluetoothManager />
      </main>
      <OfflineIndicator />
      <Notifications />
    </div>
  );
};

export default App;