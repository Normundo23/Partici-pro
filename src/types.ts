export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  participationCount: number;
  lastParticipation: Date | null;
  rank: number;
  totalScore: number;
  sectionId: string | null;
  protected: boolean;
}

export interface Section {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface ParticipationRecord {
  id: string;
  studentId: string;
  timestamp: Date;
  duration: number;
  quality: ParticipationQuality;
  keywords: string[];
  confidence: number;
}

export type ParticipationQuality = {
  keyword: string;
  color: string;
  score: number;
  description: string;
  voiceCommands: string[];
};

export const PARTICIPATION_QUALITIES: ParticipationQuality[] = [
  { 
    keyword: "Excellent", 
    color: "text-emerald-600 dark:text-emerald-400", 
    score: 5, 
    description: "Outstanding contribution",
    voiceCommands: ["excellent", "very good"]
  },
  { 
    keyword: "Very Good", 
    color: "text-blue-600 dark:text-blue-400", 
    score: 4, 
    description: "High quality response",
    voiceCommands: ["very good"]
  },
  { 
    keyword: "Good", 
    color: "text-purple-600 dark:text-purple-400", 
    score: 3, 
    description: "Solid contribution",
    voiceCommands: ["good"]
  },
  { 
    keyword: "Close", 
    color: "text-amber-600 dark:text-amber-400", 
    score: 2, 
    description: "Partially correct response",
    voiceCommands: ["close"]
  },
  { 
    keyword: "Not Quite", 
    color: "text-red-600 dark:text-red-400", 
    score: 1, 
    description: "Attempted but incorrect response",
    voiceCommands: ["not quite"]
  }
];

export type NameDetectionMode = 'firstName' | 'lastName' | 'both';

export interface Settings {
  nameDetectionMode: NameDetectionMode;
  theme: 'light' | 'dark' | 'system';
}

export interface AudioDevice {
  deviceId: string;
  label: string;
  type: string;
  connected: boolean;
  capabilities?: MediaTrackCapabilities;
}

export interface NotificationPreferences {
  participationAlerts: boolean;
  lowParticipationAlerts: boolean;
  rankingChanges: boolean;
  audioDeviceAlerts: boolean;
  minTimeBetweenAlerts: number;
}

export const VOICE_COMMANDS = {
  START_RECORDING: [
    'start recording',
    'begin recording',
    'start tracking',
    'begin tracking',
    'start monitoring',
    'begin monitoring'
  ],
  STOP_RECORDING: [
    'stop recording',
    'end recording',
    'stop tracking',
    'end tracking',
    'stop monitoring',
    'end monitoring'
  ],
  PARTICIPATION_TRIGGERS: [
    'participates',
    'answers',
    'responds',
    'contributes',
    'shares',
    'asks',
    'comments',
    'explains',
    'discusses',
    'presents'
  ]
};