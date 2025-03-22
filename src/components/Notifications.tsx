import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useStore } from '../store';
import { notificationManager } from '../utils/notifications';

export const Notifications: React.FC = () => {
  const { settings } = useStore();

  useEffect(() => {
    // Request notification permissions on component mount
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:bg-dark-800 dark:text-white',
          duration: 3000,
          style: {
            background: settings.theme === 'dark' ? '#1e293b' : '#ffffff',
            color: settings.theme === 'dark' ? '#ffffff' : '#000000',
            border: '1px solid',
            borderColor: settings.theme === 'dark' ? '#334155' : '#e2e8f0',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'white',
            },
          },
        }}
      />
    </>
  );
};