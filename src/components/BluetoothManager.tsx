import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, RefreshCw, Settings2, Bluetooth, Volume2, AlertTriangle, X, Signal, SignalLow, SignalMedium, SignalHigh, Power, Loader2, AlertCircle, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { notificationManager } from '../utils/notifications';
import { AudioTracker } from './AudioTracker';
import { VoiceRecognition } from './VoiceRecognition';

interface AudioDevice {
  deviceId: string;
  label: string;
  type: 'bluetooth' | 'wired' | 'wireless' | 'array' | 'unknown';
  connected: boolean;
  signalStrength?: number;
  batteryLevel?: number;
}

const BluetoothManager: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<AudioDevice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const monitoringRef = useRef<(() => void) | null>(null);
  const deviceListRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const MAX_RECONNECT_ATTEMPTS = 3;
  const RECONNECT_DELAY = 2000;

  const getDeviceType = useCallback((label: string): AudioDevice['type'] => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('bluetooth')) return 'bluetooth';
    if (lowerLabel.includes('wireless')) return 'wireless';
    if (lowerLabel.includes('array') || lowerLabel.includes('beam')) return 'array';
    if (lowerLabel.includes('wired') || lowerLabel.includes('usb')) return 'wired';
    return 'unknown';
  }, []);

  const getDeviceIcon = (type: AudioDevice['type']) => {
    switch (type) {
      case 'bluetooth':
        return <Bluetooth size={16} className="text-blue-500" />;
      case 'wireless':
        return <Signal size={16} className="text-green-500" />;
      case 'array':
        return <Mic size={16} className="text-purple-500" />;
      case 'wired':
        return <Volume2 size={16} className="text-amber-500" />;
      default:
        return <Volume2 size={16} className="text-gray-500" />;
    }
  };

  const cleanupAudioResources = useCallback(() => {
    // Stop media stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current?.state !== 'closed') {
      try {
        audioContextRef.current?.close();
      } catch (err) {
        console.error('Error closing AudioContext:', err);
      }
    }
    audioContextRef.current = null;

    // Clear monitoring function without recursion
    monitoringRef.current = null;
    setIsMonitoring(false);
  }, []);

  const disconnectDevice = useCallback(() => {
    if (selectedDevice) {
      const deviceLabel = selectedDevice.label;
      cleanupAudioResources();
      setSelectedDevice(null);
      setReconnectAttempts(0);
      
      toast.success(`Disconnected from ${deviceLabel}`);
      notificationManager.notifyAudioDevice(`Disconnected from ${deviceLabel}`);
    }
  }, [selectedDevice, cleanupAudioResources]);

  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || 'Unnamed Device',
          type: getDeviceType(device.label),
          connected: true,
          signalStrength: 100
        }));

      setAudioDevices(audioInputs);
      
      if (audioInputs.length === 0) {
        toast.error('No audio input devices found');
      }

      if (selectedDevice) {
        const deviceStillExists = audioInputs.find(d => d.deviceId === selectedDevice.deviceId);
        if (!deviceStillExists) {
          disconnectDevice();
          toast.error(`${selectedDevice.label} has been disconnected`);
        }
      }
    } catch (err) {
      setError('Failed to enumerate audio devices');
      console.error(err);
    } finally {
      setIsInitializing(false);
    }
  }, [selectedDevice, getDeviceType, disconnectDevice]);

  const monitorDeviceConnection = useCallback(async (device: AudioDevice) => {
    if (!device.deviceId) return;

    try {
      // Clean up existing resources first
      cleanupAudioResources();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: device.deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      source.connect(analyzer);

      setIsMonitoring(true);
      toast.success(`Monitoring ${device.label}`);

      // Set up monitoring cleanup without recursion
      const cleanup = () => {
        if (streamRef.current === stream) {
          cleanupAudioResources();
        }
      };
      monitoringRef.current = cleanup;

    } catch (err) {
      console.error('Error monitoring device:', err);
      notificationManager.notifyAudioDevice(`Failed to monitor ${device.label}`);
      handleConnectionError(device);
    }
  }, [cleanupAudioResources]);

  const handleConnectionError = useCallback((device: AudioDevice) => {
    setError(`Connection lost to ${device.label}`);
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      setTimeout(() => {
        handleReconnect(device);
      }, RECONNECT_DELAY * (reconnectAttempts + 1));
    } else {
      toast.error(`Failed to reconnect to ${device.label} after ${MAX_RECONNECT_ATTEMPTS} attempts`);
      disconnectDevice();
    }
  }, [reconnectAttempts, disconnectDevice]);

  const connectToDevice = async (device: AudioDevice) => {
    try {
      setIsConnecting(true);
      setError(null);

      cleanupAudioResources();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: device.deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setSelectedDevice(device);
      setShowDeviceList(false);
      
      toast.success(`Connected to ${device.label}`);
      notificationManager.notifyAudioDevice(`Connected to ${device.label}`);

      await monitorDeviceConnection(device);
    } catch (err: any) {
      const errorMessage = `Failed to connect to ${device.label}: ${err.message}`;
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const handleReconnect = async (device: AudioDevice) => {
    setReconnectAttempts(prev => prev + 1);
    const toastId = toast.loading(`Attempting to reconnect to ${device.label}...`);
    
    try {
      await connectToDevice(device);
      setReconnectAttempts(0);
      toast.success(`Reconnected to ${device.label}`, { id: toastId });
    } catch (err) {
      console.error('Reconnection failed:', err);
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        toast.error(`Failed to reconnect to ${device.label}`, { id: toastId });
        disconnectDevice();
      }
    }
  };

  const refreshDevices = async () => {
    setIsConnecting(true);
    const toastId = toast.loading('Refreshing audio devices...');
    await enumerateDevices();
    setIsConnecting(false);
    toast.success('Audio devices refreshed', { id: toastId });
  };

  useEffect(() => {
    enumerateDevices();
    
    const handleDeviceChange = () => {
      enumerateDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      cleanupAudioResources();
    };
  }, [enumerateDevices, cleanupAudioResources]);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <AudioTracker selectedDevice={selectedDevice || undefined} />
        {error && (
          <div className="absolute bottom-full mb-4 left-0 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg shadow-lg max-w-[calc(100vw-3rem)] sm:max-w-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-500 flex-shrink-0" size={16} />
              <p className="text-sm text-red-700 dark:text-red-200 line-clamp-2">{error}</p>
            </div>
          </div>
        )}

        {showDeviceList && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowDeviceList(false)}
            />
            <div 
              ref={deviceListRef}
              className="fixed z-50 bottom-20 left-0 bg-white dark:bg-dark-800 rounded-lg shadow-xl w-[300px]"
            >
              <div className="p-4 border-b dark:border-dark-700 flex items-center justify-between">
                <h3 className="font-semibold dark:text-white">Select Audio Input</h3>
                <button
                  onClick={refreshDevices}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full"
                  disabled={isConnecting}
                >
                  <RefreshCw size={16} className={isConnecting ? 'animate-spin' : ''} />
                </button>
              </div>
              
              <div className="p-2 max-h-[300px] overflow-y-auto">
                {isInitializing ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                  </div>
                ) : audioDevices.length > 0 ? (
                  audioDevices.map(device => (
                    <button
                      key={device.deviceId}
                      onClick={() => connectToDevice(device)}
                      disabled={isConnecting}
                      className={`
                        w-full text-left p-3 rounded-lg flex items-center gap-3
                        ${device.deviceId === selectedDevice?.deviceId 
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-dark-700'
                        }
                      `}
                    >
                      {getDeviceIcon(device.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium dark:text-white truncate">
                          {device.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {device.type}
                        </p>
                      </div>
                      {device.deviceId === selectedDevice?.deviceId && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No audio devices found
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-2">
          {selectedDevice ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeviceList(!showDeviceList)}
                className="relative bg-white dark:bg-dark-800 px-3 sm:px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 sm:gap-3 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors min-w-0"
              >
                <div className="flex-shrink-0">
                  {isMonitoring ? (
                    <Mic size={16} className="text-green-500 animate-pulse" />
                  ) : (
                    <MicOff size={16} className="text-red-500" />
                  )}
                </div>
                <span className="text-sm font-medium dark:text-white truncate max-w-[100px] sm:max-w-[150px]">
                  {selectedDevice.label}
                </span>
              </button>
              <button
                onClick={disconnectDevice}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                title="Disconnect device"
              >
                <Power size={20} />
              </button>
              <div className="ml-2">
                <VoiceRecognition />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeviceList(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
              >
                <Settings2 size={20} />
                <span>Select Audio Input</span>
              </button>
              <div className="ml-2">
                <VoiceRecognition />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BluetoothManager;