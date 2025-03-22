import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Volume2, AlertCircle, RefreshCw, Settings, Activity, WifiOff } from 'lucide-react';
import { useStore } from '../store';
import { PARTICIPATION_QUALITIES, AudioDevice } from '../types';
import { toast } from 'react-hot-toast';

interface AudioTrackerProps {
  selectedDevice?: AudioDevice;
  onDeviceSelect?: (device: AudioDevice) => void;
}

export const AudioTracker: React.FC<AudioTrackerProps> = ({ selectedDevice, onDeviceSelect }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'unstable'>('disconnected');
  const [signalStrength, setSignalStrength] = useState(0);
  const refreshInterval = useRef<number>();
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const signalCheckInterval = useRef<number>();
  const { students, recordParticipation, isTracking, startTracking, stopTracking, settings } = useStore();

  const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
  const CALIBRATION_DURATION = 5000; // 5 seconds
  const NOISE_THRESHOLD = 0.15; // 15% above baseline
  const SIGNAL_CHECK_INTERVAL = 1000; // 1 second

  const checkSignalStrength = () => {
    if (!analyzerRef.current || !isListening) return;

    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    
    // Calculate signal strength (0-100)
    const strength = Math.min(100, (average / 128) * 100);
    setSignalStrength(strength);

    // Update connection status based on signal strength
    if (strength > 60) {
      setConnectionStatus('connected');
    } else if (strength > 30) {
      setConnectionStatus('unstable');
    } else {
      setConnectionStatus('disconnected');
    }
  };

  const calibrateAudio = async () => {
    if (!audioContext || !analyzerRef.current) return;

    setIsCalibrating(true);
    toast.loading('Calibrating microphone...', { duration: CALIBRATION_DURATION });

    const samples: number[] = [];
    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    
    const sampleInterval = setInterval(() => {
      analyzerRef.current?.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      samples.push(average);
    }, 100);

    await new Promise(resolve => setTimeout(resolve, CALIBRATION_DURATION));
    clearInterval(sampleInterval);

    const baselineNoise = samples.reduce((a, b) => a + b) / samples.length;
    setNoiseLevel(baselineNoise);
    setIsCalibrating(false);

    toast.success('Microphone calibrated successfully');
    return baselineNoise;
  };

  const refreshVoiceDetection = async () => {
    if (!isListening) return;

    toast.loading('Refreshing voice detection...', { duration: 2000 });
    
    // Temporarily stop recognition
    recognition?.stop();
    
    // Recalibrate
    await calibrateAudio();
    
    // Restart recognition
    recognition?.start();
    setLastRefresh(Date.now());
    
    toast.success('Voice detection refreshed');
  };

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Speech recognition is not supported in this browser', {
        id: 'speech-recognition-not-supported'
      });
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;

    recognitionInstance.onresult = async (event: any) => {
      if (!isTracking) return;

      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript.toLowerCase())
        .join(' ');

      // Check noise level
      if (analyzerRef.current) {
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(dataArray);
        const currentLevel = dataArray.reduce((a, b) => a + b) / dataArray.length;

        if (currentLevel > noiseLevel * (1 + NOISE_THRESHOLD)) {
          console.log('Voice detected above noise threshold');
        }
      }

      for (const student of students) {
        let nameMatch = false;

        switch (settings.nameDetectionMode) {
          case 'firstName':
            nameMatch = transcript.includes(student.firstName.toLowerCase());
            break;
          case 'lastName':
            nameMatch = transcript.includes(student.lastName.toLowerCase());
            break;
          case 'both':
          default:
            nameMatch = transcript.includes(`${student.firstName.toLowerCase()} ${student.lastName.toLowerCase()}`);
            break;
        }

        if (nameMatch) {
          const detectedKeywords = transcript.split(' ');
          const matchedQuality = PARTICIPATION_QUALITIES.find(quality =>
            transcript.includes(quality.keyword.toLowerCase())
          ) || PARTICIPATION_QUALITIES[0];

          console.log(`Detected student: ${student.firstName} ${student.lastName} with quality: ${matchedQuality.keyword} (Score: ${matchedQuality.score})`);
          
          await recordParticipation(
            student.id,
            60,
            matchedQuality,
            detectedKeywords,
            0.8
          );
          
          console.log(`Recorded participation for ${student.firstName} ${student.lastName} with score ${matchedQuality.score}`);
        }
      }
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setPermissionError(true);
        toast.error('Microphone access denied. Please check your browser permissions.', {
          id: 'microphone-permission-error',
          duration: 5000
        });
      }
      setIsListening(false);
      setConnectionStatus('disconnected');
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [students, recordParticipation, isTracking, settings.nameDetectionMode]);

  const toggleListening = async () => {
    if (isListening) {
      try {
        recognition?.stop();
        stopTracking();
        setIsListening(false);
        setConnectionStatus('disconnected');
        if (refreshInterval.current) {
          clearInterval(refreshInterval.current);
        }
        if (signalCheckInterval.current) {
          clearInterval(signalCheckInterval.current);
        }
        toast.success('Stopped listening');
        // Reset permission error when stopping
        setPermissionError(false);
      } catch (err) {
        console.error('Error stopping recording:', err);
        toast.error('Failed to stop recording', {
          id: 'stop-recording-error'
        });
        // Force reset state even if there's an error
        setIsListening(false);
        setConnectionStatus('disconnected');
      }
    } else {
      // Don't try to start if we already know permissions are denied
      if (permissionError) {
        toast.error('Microphone access denied. Please check your browser permissions.', {
          id: 'microphone-permission-error',
          duration: 5000
        });
        return;
      }
      
      try {
        const constraints = {
          audio: {
            deviceId: selectedDevice ? { exact: selectedDevice.deviceId } : undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        const context = new AudioContext();
        const source = context.createMediaStreamSource(stream);
        const analyzer = context.createAnalyser();
        analyzer.fftSize = 2048;
        source.connect(analyzer);
        analyzerRef.current = analyzer;
        setAudioContext(context);
        
        await calibrateAudio();
        
        recognition?.start();
        startTracking();
        setIsListening(true);
        setPermissionError(false);
        setConnectionStatus('connected');
        toast.success(`Started listening${selectedDevice ? ` using ${selectedDevice.label}` : ''}`);

        // Set up periodic refresh
        refreshInterval.current = window.setInterval(() => {
          refreshVoiceDetection();
        }, REFRESH_INTERVAL);

        // Set up signal strength monitoring
        signalCheckInterval.current = window.setInterval(() => {
          checkSignalStrength();
        }, SIGNAL_CHECK_INTERVAL);
      } catch (err) {
        console.error('Error starting recording:', err);
        setPermissionError(true);
        setConnectionStatus('disconnected');
        toast.error('Failed to access microphone. Please check your browser permissions.', {
          id: 'microphone-access-error',
          duration: 5000
        });
      }
    }
  };

  useEffect(() => {
    if (isListening) {
      toggleListening();
    }
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
      if (signalCheckInterval.current) {
        clearInterval(signalCheckInterval.current);
      }
    };
  }, [selectedDevice]);

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Activity size={20} className="text-green-500" />;
      case 'unstable':
        return <Activity size={20} className="text-yellow-500" />;
      case 'disconnected':
        return <WifiOff size={20} className="text-red-500" />;
    }
  };

  return (
    <div className="flex gap-2">
      {isListening && (
        <button
          onClick={refreshVoiceDetection}
          className="p-4 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-colors"
          title="Refresh voice detection"
          disabled={isCalibrating}
        >
          <RefreshCw size={24} className={isCalibrating ? 'animate-spin' : ''} />
        </button>
      )}
      
      <button
        onClick={toggleListening}
        className={`p-4 rounded-full shadow-lg transition-colors ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
        title={isListening ? 'Stop listening' : 'Start listening'}
        disabled={!selectedDevice || isCalibrating}
      >
        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
      </button>

      {permissionError && (
        <div className="ml-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <AlertCircle size={16} />
          <span className="text-sm">Microphone access denied</span>
        </div>
      )}

      {isListening && (
        <div className="ml-2 bg-white dark:bg-dark-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          {getConnectionStatusIcon()}
          <div className="w-24 h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
              style={{ width: `${signalStrength}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">{Math.round(signalStrength)}%</span>
        </div>
      )}
    </div>
  );
};