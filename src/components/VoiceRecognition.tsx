import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useStore } from '../store';
import { findQualityFromVoiceCommand, findStudentNameInTranscript, VOICE_COMMANDS, matchVoiceCommand } from '../utils/voiceCommands';
import { PARTICIPATION_QUALITIES } from '../types';
import { toast } from 'react-hot-toast';
import { Mic, MicOff, Activity } from 'lucide-react';

export const VoiceRecognition: React.FC = () => {
  const { 
    students, 
    recordParticipation, 
    settings,
    isTracking,
    startTracking,
    stopTracking,
    currentSectionId
  } = useStore();
  
  const [isRecognitionActive, setIsRecognitionActive] = useState(false);
  const recognitionRef = useRef<any>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 1000; // 1 second
  const [permissionDenied, setPermissionDenied] = useState(false); // Track permission state
  const [permissionChecked, setPermissionChecked] = useState(false); // Track if permission was checked
  
  // Add debounce mechanism to prevent rapid toggling
  const lastStateChangeTime = useRef<number>(0);
  const MIN_STATE_CHANGE_INTERVAL = 500; // Reduced from 1000ms to 500ms for even more responsive recognition
  const notificationDebounceRef = useRef<{[key: string]: number}>({});
  // Add a flag to track if we're currently processing a transcript
  const isProcessingTranscript = useRef<boolean>(false);
  // Add a flag to track when the recognition is ready for the next command
  const isReadyForNextCommand = useRef<boolean>(true);

  const handleVoiceResult = useCallback((transcript: string) => {
    console.log('Processing voice transcript:', transcript);
    
    // Prevent concurrent processing of transcripts
    if (isProcessingTranscript.current) {
      console.log('Already processing a transcript, skipping this one');
      return;
    }
    
    isProcessingTranscript.current = true;
    
    try {
      // Check for start/stop commands
      if (matchVoiceCommand(transcript, VOICE_COMMANDS.START_RECORDING)) {
        console.log('Start recording command detected');
        if (!currentSectionId) {
          toast.error('Please select a section first');
          return;
        }
        startTracking();
        toast.success('Started tracking participation');
        return;
      }

      if (matchVoiceCommand(transcript, VOICE_COMMANDS.STOP_RECORDING)) {
        console.log('Stop recording command detected');
        stopTracking();
        toast.success('Stopped tracking participation');
        return;
      }

      if (!isTracking || !currentSectionId) {
        console.log('Not processing participation: tracking is off or no section selected');
        return;
      }

      // Look for participation triggers with more flexible detection
      const hasTrigger = VOICE_COMMANDS.PARTICIPATION_TRIGGERS.some(trigger => {
        const found = transcript.includes(trigger);
        if (found) console.log(`Participation trigger found: "${trigger}"`);
        return found;
      });
      
      if (hasTrigger) {
        console.log('Participation trigger detected, looking for student name...');
        const student = findStudentNameInTranscript(transcript, students, settings.nameDetectionMode);
        
        if (student) {
          console.log(`Student found: ${student.firstName} ${student.lastName}`);
          // Check for quality in THIS transcript only - don't use default if not found
          const quality = findQualityFromVoiceCommand(transcript);
          
          // Only proceed if we found both a student AND a quality in the same transcript
          if (quality) {
            console.log(`Using quality: ${quality.keyword} (Score: ${quality.score})`);
            
            const studentRecord = students.find(
              s => s.firstName.toLowerCase() === student.firstName.toLowerCase() && 
                 s.lastName.toLowerCase() === student.lastName.toLowerCase()
            );
            
            if (studentRecord) {
              console.log(`Recording participation for student ID: ${studentRecord.id}`);
              // Use async/await to ensure the participation is fully recorded before proceeding
              (async () => {
                try {
                  await recordParticipation(
                    studentRecord.id,
                    60,
                    quality,
                    transcript.split(' '),
                    0.8
                  );
                  console.log(`Recorded participation for ${studentRecord.firstName} ${studentRecord.lastName} with quality ${quality.keyword} (Score: ${quality.score})`);
                  toast.success(`Recorded ${quality.keyword} (Score: ${quality.score}) participation for ${student.lastName}, ${student.firstName}`);
                  
                  // Force a re-render of the StudentList component by dispatching a custom event
                  window.dispatchEvent(new CustomEvent('participation-recorded', { 
                    detail: { studentId: studentRecord.id, quality: quality }
                  }));
                } catch (error) {
                  console.error('Error recording participation:', error);
                  toast.error('Failed to record participation');
                }
              })();
            } else {
              console.error('Student record not found in database despite name match');
            }
          } else {
            console.log('Student found but no quality specified in this transcript - ignoring');
            toast.info(`Student ${student.lastName}, ${student.firstName} detected but no quality specified`);
          }
        } else {
          console.log('No student name found in transcript');
        }
      } else {
        console.log('No participation trigger found in transcript');
      }
    } finally {
      // Always reset the processing flag when done
      isProcessingTranscript.current = false;
    }
  }, [students, recordParticipation, settings.nameDetectionMode, isTracking, currentSectionId, startTracking, stopTracking]);

  const initializeRecognition = useCallback(() => {
    // Check for standard SpeechRecognition first, then fallback to webkit
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      console.warn('Speech recognition is not supported in this browser');
      // Use toast.error with an ID to prevent duplicates
      if (!notificationDebounceRef.current['speech-not-supported']) {
        notificationDebounceRef.current['speech-not-supported'] = Date.now();
        toast.error('Speech recognition is not supported in this browser', {
          id: 'speech-recognition-not-supported',
          duration: 5000
        });
      }
      return null; // Return null instead of JSX
    }

    // Use the appropriate constructor
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('Recognition started successfully');
      setIsRecognitionActive(true);
      reconnectAttempts.current = 0;
      
      // We're removing the toast notification for recognition active state
      // to reduce the frequency of notifications as requested
      notificationDebounceRef.current['recognition-active'] = Date.now();
      // No toast notification here anymore
    };

    recognition.onresult = (event: any) => {
      const results = Array.from(event.results);
      for (const result of results) {
        if (result.isFinal) {
          const transcript = result[0].transcript.toLowerCase();
          const confidence = result[0].confidence;
          console.log('Transcript:', transcript); 
          console.log('Confidence:', confidence);
          console.log('Current tracking state:', isTracking ? 'ON' : 'OFF');
          console.log('Current section ID:', currentSectionId);
          console.log('Name detection mode:', settings.nameDetectionMode);
          console.log('Available students:', students.map(s => `${s.firstName} ${s.lastName}`).join(', '));
          
          // Only process if we're not already processing another transcript
          if (!isProcessingTranscript.current) {
            handleVoiceResult(transcript);
            
            // Restart recognition after processing to ensure it continues working
            // This is crucial to fix the issue where recognition stops after one command
            // Using a much shorter delay to improve responsiveness
            setTimeout(() => {
              if (recognitionRef.current && isTracking) {
                try {
                  recognitionRef.current.stop();
                  // Further reduced delay for faster restart
                  setTimeout(() => {
                    if (recognitionRef.current && isTracking) {
                      recognitionRef.current.start();
                      console.log('Recognition restarted quickly after processing');
                    }
                  }, 50); // Reduced from 100ms to 50ms for even faster response
                } catch (error) {
                  console.error('Error restarting recognition after result:', error);
                  // Force create a new instance if there's an error with reduced delay
                  setTimeout(() => {
                    if (isTracking) {
                      createAndStartNewRecognition();
                      console.log('Created new recognition instance after error');
                    }
                  }, 100); // Reduced from 200ms to 100ms for faster recovery
                }
              }
            }, 150); // Reduced from 300ms to 150ms for much faster response
          } else {
            console.log('Skipping transcript processing - already processing another transcript');
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        // Only show the error message once
        if (!permissionDenied) {
          setPermissionDenied(true);
          toast.error('Microphone access denied. Please check your browser permissions.', {
            duration: 5000, // Show for longer
            id: 'mic-permission-error' // Use an ID to prevent duplicates
          });
        }
        return;
      }

      // Clear any existing reconnection timeout
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }

      // Only update state if it's been at least MIN_STATE_CHANGE_INTERVAL since the last change
      const now = Date.now();
      if (now - lastStateChangeTime.current > MIN_STATE_CHANGE_INTERVAL) {
        lastStateChangeTime.current = now;
        setIsRecognitionActive(false);
      }

      // Handle specific error types with appropriate recovery strategies
      if (event.error === 'network') {
        // Network errors should retry quickly
        reconnectTimeout.current = setTimeout(() => {
          console.log('Network error detected, attempting immediate reconnection...');
          startRecognition();
        }, 300); // Very quick retry for network errors
        return;
      }
      
      if (event.error === 'no-speech') {
        // No speech detected, just restart immediately
        reconnectTimeout.current = setTimeout(() => {
          console.log('No speech detected, restarting recognition...');
          startRecognition();
        }, 100); // Almost immediate restart
        return;
      }

      // For other errors, use progressive backoff strategy
      // Attempt to reconnect if we haven't exceeded the maximum attempts
      // Using a more aggressive reconnection strategy with shorter delays
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS && !permissionDenied) {
        reconnectAttempts.current++;
        
        // Reduced delay for faster reconnection
        reconnectTimeout.current = setTimeout(() => {
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})...`);
          startRecognition();
        }, Math.min(300, RECONNECT_DELAY * reconnectAttempts.current / 3)); // Even faster reconnect with a cap at 300ms
      } else if (!permissionDenied) {
        // Reset reconnect attempts to allow future reconnection attempts
        reconnectAttempts.current = 0;
        
        // Only show this error if it's not a permission issue and we haven't shown it recently
        const now = Date.now();
        if (!notificationDebounceRef.current['recognition-error'] || 
            now - notificationDebounceRef.current['recognition-error'] > 10000) {
          notificationDebounceRef.current['recognition-error'] = now;
          toast.error('Voice recognition failed to connect. Please refresh the page.', {
            id: 'voice-recognition-error' // Use an ID to prevent duplicates
          });
          
          // Try one more time after a longer delay
          reconnectTimeout.current = setTimeout(() => {
            console.log('Final reconnection attempt after error notification...');
            startRecognition();
          }, 2000);
        }
      }
    };

    recognition.onend = () => {
      console.log('Recognition ended');
      
      // Only update state if it's been at least MIN_STATE_CHANGE_INTERVAL since the last change
      const now = Date.now();
      if (now - lastStateChangeTime.current > MIN_STATE_CHANGE_INTERVAL) {
        lastStateChangeTime.current = now;
        setIsRecognitionActive(false);
      }
      
      // Only attempt to restart if we're supposed to be tracking and don't have permission issues
      // Further reduced the time constraint to allow even faster restarts
      if (isTracking && !permissionDenied) {
        // Immediately restart recognition to ensure continuous listening
        console.log('Immediately restarting recognition after end event');
        // Use a more reliable restart approach
        recognitionRef.current = null; // Force a new instance creation
        startRecognition();
      }
    };

    return recognition;
  }, [handleVoiceResult, isTracking, permissionDenied, students]);

  // Helper function to create and start a new recognition instance
  const createAndStartNewRecognition = useCallback(() => {
    try {
      // Further reduced the time constraint to allow even more frequent recognition restarts
      // This helps make the voice recognition much more responsive
      const now = Date.now();
      if (now - lastStateChangeTime.current < 200) { // Reduced from 500ms to 200ms for much faster recognition
        console.log('Skipping recognition start - too soon since last state change');
        return;
      }
      
      // Create a new recognition instance
      recognitionRef.current = initializeRecognition();

      if (recognitionRef.current) {
        console.log('Starting recognition...');
        lastStateChangeTime.current = now;
        recognitionRef.current.start();
        // Removed visual feedback toast notification as requested by user
        // to reduce the frequency of notifications
      } else {
        // Handle case where recognition couldn't be initialized
        console.error('Speech recognition could not be initialized');
        const now = Date.now();
        if (!notificationDebounceRef.current['speech-unavailable'] || 
            now - notificationDebounceRef.current['speech-unavailable'] > 10000) {
          notificationDebounceRef.current['speech-unavailable'] = now;
          toast.error('Speech recognition not available in this browser', {
            id: 'speech-recognition-unavailable'
          });
        }
      }
    } catch (error) {
      console.error('Error in createAndStartNewRecognition:', error);
      
      // Only update state if it's been at least 500ms since the last change
      const now = Date.now();
      if (now - lastStateChangeTime.current > 500) { // Reduced from MIN_STATE_CHANGE_INTERVAL (3000ms) to 500ms
        lastStateChangeTime.current = now;
        setIsRecognitionActive(false);
      }
      
      // If we get an InvalidStateError, the recognition might be stuck
      if (error instanceof DOMException && error.name === 'InvalidStateError' && !permissionDenied) {
        console.log('InvalidStateError detected, will retry after delay');
        // Force reset the recognition instance
        recognitionRef.current = null;
        
        // Try again after a much shorter delay
        setTimeout(() => {
          console.log('Retrying recognition start after InvalidStateError');
          try {
            // Further reduced time constraint for even faster recovery
            const now = Date.now();
            if (now - lastStateChangeTime.current > 200) { // Reduced from 500ms to 200ms for faster recovery
              recognitionRef.current = initializeRecognition();
              if (recognitionRef.current) {
                lastStateChangeTime.current = now;
                recognitionRef.current.start();
                console.log('Successfully restarted recognition after error');
              }
            }
          } catch (retryError) {
            console.error('Error in retry after InvalidStateError:', retryError);
          }
        }, 200); // Reduced from 500ms to 200ms for much faster recovery
      }
    }
  }, [initializeRecognition, permissionDenied]);


  const startRecognition = useCallback(() => {
    // If we already have a recognition instance, stop it first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping existing recognition:', error);
      }
      recognitionRef.current = null;
    }
    
    // Create and start a new recognition instance
    createAndStartNewRecognition();
  }, [createAndStartNewRecognition]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        console.log('Stopping recognition...');
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setIsRecognitionActive(false);
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    // Clear any pending reconnect timeout
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = undefined;
    }
  }, []);

  // Check for microphone permission on component mount
  useEffect(() => {
    if (!permissionChecked) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          setPermissionDenied(false);
          setPermissionChecked(true);
        })
        .catch(error => {
          console.error('Microphone permission error:', error);
          setPermissionDenied(true);
          setPermissionChecked(true);
          toast.error('Microphone access denied. Please check your browser permissions.', {
            duration: 5000,
            id: 'mic-permission-error'
          });
        });
    }
  }, [permissionChecked]);

  // Start/stop recognition based on isTracking state
  useEffect(() => {
    if (isTracking && !permissionDenied) {
      startRecognition();
      
      // Set up a more frequent periodic check to ensure recognition is still running
      const checkInterval = setInterval(() => {
        if (isTracking && !isRecognitionActive && !permissionDenied) {
          console.log('Recognition appears to be inactive, restarting...');
          startRecognition();
        }
      }, 3000); // Check every 3 seconds for more reliable tracking
      
      return () => {
        clearInterval(checkInterval);
        stopRecognition();
      };
    } else {
      stopRecognition();
      
      return () => {
        stopRecognition();
      };
    }
  }, [isTracking, permissionDenied, startRecognition, stopRecognition, isRecognitionActive]);
  
  // Add a recovery mechanism that restarts recognition if it stops unexpectedly
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isTracking && !permissionDenied && !isRecognitionActive) {
        console.log('Page became visible, ensuring recognition is active');
        startRecognition();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTracking, permissionDenied, isRecognitionActive, startRecognition]);

  // Render the status indicator to be used alongside the Select Audio Input button
  return (
    <div className="inline-flex">
      {isRecognitionActive ? (
        <div 
          className="bg-white dark:bg-dark-800 rounded-lg p-2 shadow-lg flex items-center gap-2 animate-fade-in relative overflow-hidden"
          title="Voice recognition is active and listening"
        >
          <div className="absolute bottom-0 left-0 h-1 bg-green-500 animate-pulse w-full"></div>
          <Activity size={20} className="text-green-500 animate-pulse" />
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Listening</span>
          <div className="ml-1 flex space-x-1">
            <div className="w-1 h-4 bg-green-500 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
            <div className="w-1 h-4 bg-green-500 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
            <div className="w-1 h-4 bg-green-500 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
          </div>
        </div>
      ) : isProcessingTranscript.current ? (
        <div 
          className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 shadow-lg flex items-center gap-2 animate-fade-in"
          title="Processing your voice command"
        >
          <Loader2 size={20} className="text-blue-500 animate-spin" />
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Processing</span>
        </div>
      ) : isTracking ? (
        <div 
          className="bg-green-50 dark:bg-green-900/30 rounded-lg p-2 shadow-lg flex items-center gap-2 animate-fade-in"
          title="Voice recognition is ready for commands"
        >
          <Mic size={20} className="text-green-500" />
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Ready for Commands</span>
        </div>
      ) : (
        <div 
          className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 shadow-lg flex items-center gap-2"
          title="Voice recognition is turned off"
        >
          <MicOff size={20} className="text-gray-500" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Voice Recognition Off</span>
        </div>
      )}
      {permissionDenied && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in ml-2">
          <MicOff size={16} />
          <span className="text-sm">Microphone access denied</span>
        </div>
      )}
    </div>
  );
};