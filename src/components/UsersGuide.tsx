import React from 'react';
import { Book, Mic, Star, Award, Command, Keyboard, Lightbulb } from 'lucide-react';
import { PARTICIPATION_QUALITIES, VOICE_COMMANDS } from '../types';

export const UsersGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Book className="text-blue-500" size={24} />
          <h2 className="text-xl font-semibold dark:text-white">User's Guide</h2>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm divide-y dark:divide-dark-700">
          {/* Voice Commands Section */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="text-purple-500" size={20} />
              <h3 className="text-lg font-medium dark:text-white">Voice Commands</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recording Controls</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {VOICE_COMMANDS.START_RECORDING.map(command => (
                    <div key={command} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <code className="text-green-600 dark:text-green-400 text-sm">"{command}"</code>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Start recording</span>
                    </div>
                  ))}
                  {VOICE_COMMANDS.STOP_RECORDING.map(command => (
                    <div key={command} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      <code className="text-red-600 dark:text-red-400 text-sm">"{command}"</code>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Stop recording</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Participation Triggers</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Use these words with a student's name to record participation:
                </p>
                <div className="flex flex-wrap gap-2">
                  {VOICE_COMMANDS.PARTICIPATION_TRIGGERS.map(trigger => (
                    <div key={trigger} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <code className="text-blue-600 dark:text-blue-400 text-sm">"{trigger}"</code>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                  Example: "John Smith answers thoughtfully"
                </p>
              </div>
            </div>
          </div>

          {/* Quality Keywords Section */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="text-amber-500" size={20} />
              <h3 className="text-lg font-medium dark:text-white">Quality Keywords</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PARTICIPATION_QUALITIES.map(quality => (
                <div 
                  key={quality.keyword}
                  className="p-3 rounded-lg border dark:border-dark-700 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {quality.score >= 4 ? (
                        <Star size={16} className={quality.color} />
                      ) : (
                        <Award size={16} className={quality.color} />
                      )}
                      <span className={`font-medium ${quality.color}`}>
                        {quality.keyword}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      +{quality.score} points
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {quality.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {quality.voiceCommands.map(command => (
                      <code 
                        key={command}
                        className={`text-xs px-2 py-1 rounded ${quality.color} bg-opacity-10 dark:bg-opacity-20`}
                      >
                        "{command}"
                      </code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts Section */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Keyboard className="text-indigo-500" size={20} />
              <h3 className="text-lg font-medium dark:text-white">Keyboard Shortcuts</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-700 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">Start/Stop Recording</span>
                <kbd className="px-2 py-1 bg-white dark:bg-dark-600 rounded border dark:border-dark-500 text-sm">
                  Space
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-700 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">Quick Add Student</span>
                <kbd className="px-2 py-1 bg-white dark:bg-dark-600 rounded border dark:border-dark-500 text-sm">
                  Ctrl + A
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-700 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">Toggle Settings</span>
                <kbd className="px-2 py-1 bg-white dark:bg-dark-600 rounded border dark:border-dark-500 text-sm">
                  Ctrl + ,
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-700 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">Switch Class</span>
                <kbd className="px-2 py-1 bg-white dark:bg-dark-600 rounded border dark:border-dark-500 text-sm">
                  Ctrl + K
                </kbd>
              </div>
            </div>
          </div>

          {/* Best Practices Section */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="text-yellow-500" size={20} />
              <h3 className="text-lg font-medium dark:text-white">Best Practices</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-dark-700 rounded">
                <Command size={16} className="text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Speak clearly and at a normal pace when using voice commands
                </p>
              </div>
              <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-dark-700 rounded">
                <Command size={16} className="text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Use full names for better student recognition accuracy
                </p>
              </div>
              <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-dark-700 rounded">
                <Command size={16} className="text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Quality keywords can be used in any order with the student's name
                </p>
              </div>
              <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-dark-700 rounded">
                <Command size={16} className="text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Monitor the audio indicator to ensure your microphone is working
                </p>
              </div>
              <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-dark-700 rounded">
                <Command size={16} className="text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Use keyboard shortcuts for quick actions during active teaching
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};