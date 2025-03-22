import { PARTICIPATION_QUALITIES } from '../types';

export const findQualityFromVoiceCommand = (transcript: string): typeof PARTICIPATION_QUALITIES[number] | null => {
  const words = transcript.toLowerCase().split(' ');
  
  console.log('Checking quality in transcript:', transcript.toLowerCase());
  
  // First check for exact matches of the new scoring keywords
  if (transcript.toLowerCase().includes('not quite')) {
    console.log('Found quality match: Not Quite (Score 1)');
    return PARTICIPATION_QUALITIES[4]; // Not Quite - Score 1
  } else if (transcript.toLowerCase().includes('close')) {
    console.log('Found quality match: Close (Score 2)');
    return PARTICIPATION_QUALITIES[3]; // Close - Score 2
  } else if (transcript.toLowerCase().includes('good') && !transcript.toLowerCase().includes('very good')) {
    console.log('Found quality match: Good (Score 3)');
    return PARTICIPATION_QUALITIES[2]; // Good - Score 3
  } else if (transcript.toLowerCase().includes('very good')) {
    console.log('Found quality match: Very Good (Score 4)');
    return PARTICIPATION_QUALITIES[1]; // Very Good - Score 4
  } else if (transcript.toLowerCase().includes('excellent')) {
    console.log('Found quality match: Excellent (Score 5)');
    return PARTICIPATION_QUALITIES[0]; // Excellent - Score 5
  }
  
  // If no direct match, check through all qualities and their voice commands
  for (const quality of PARTICIPATION_QUALITIES) {
    // Check exact quality keyword match
    if (transcript.toLowerCase().includes(quality.keyword.toLowerCase())) {
      console.log(`Found quality match: ${quality.keyword} (Score ${quality.score})`);
      return quality;
    }
    
    // Check voice command matches
    for (const command of quality.voiceCommands) {
      if (transcript.toLowerCase().includes(command.toLowerCase())) {
        console.log(`Found quality match via command "${command}": ${quality.keyword} (Score ${quality.score})`);
        return quality;
      }
    }
  }
  
  console.log('No quality match found in transcript');
  return null;
};

export const findStudentNameInTranscript = (
  transcript: string,
  students: { firstName: string; lastName: string }[],
  mode: 'firstName' | 'lastName' | 'both'
): { firstName: string; lastName: string } | null => {
  const normalizedTranscript = transcript.toLowerCase();
  const words = normalizedTranscript.split(/\s+/);
  
  console.log('Searching for student in transcript:', normalizedTranscript);
  console.log('Detection mode:', mode);
  
  // Track the best match to avoid duplicates
  let bestMatch: { firstName: string; lastName: string } | null = null;
  let bestMatchScore = 0;
  
  // Minimum threshold for considering a match valid
  const MIN_MATCH_THRESHOLD = 3;
  
  // Store exact word matches to improve accuracy
  const exactWordMatches: {[key: string]: boolean} = {};
  words.forEach(word => { exactWordMatches[word] = true; });
  
  for (const student of students) {
    const firstName = student.firstName.toLowerCase();
    const lastName = student.lastName.toLowerCase();
    
    console.log(`Checking student: ${firstName} ${lastName}`);
    let currentScore = 0;
    
    // Check for exact lastName match with highest priority
    const exactLastNameMatch = exactWordMatches[lastName];
    // Check for partial lastName match with lower priority
    const partialLastNameMatch = !exactLastNameMatch && words.some(word => 
      word.length > 3 && lastName.length > 3 && 
      (word.includes(lastName) || lastName.includes(word)));
    
    if (exactLastNameMatch) {
      console.log(`Found exact lastName match: ${lastName}`);
      currentScore += 5; // Higher score for exact lastName match
    } else if (partialLastNameMatch) {
      console.log(`Found partial lastName match: ${lastName}`);
      currentScore += 2; // Lower score for partial match
    }
    
    // Then follow the specified mode for additional checks
    switch (mode) {
      case 'firstName':
        const exactFirstNameMatch = exactWordMatches[firstName];
        const partialFirstNameMatch = !exactFirstNameMatch && words.some(word => 
          word.length > 3 && firstName.length > 3 && 
          (word.includes(firstName) || firstName.includes(word)));
        
        if (exactFirstNameMatch) {
          console.log(`Found exact firstName match: ${firstName}`);
          currentScore += 3;
        } else if (partialFirstNameMatch) {
          console.log(`Found partial firstName match: ${firstName}`);
          currentScore += 1;
        }
        break;
      case 'both':
        // Check for firstName match
        const exactFirstNameMatchInBoth = exactWordMatches[firstName];
        const partialFirstNameMatchInBoth = !exactFirstNameMatchInBoth && words.some(word => 
          word.length > 3 && firstName.length > 3 && 
          (word.includes(firstName) || firstName.includes(word)));
        
        if (exactFirstNameMatchInBoth) {
          console.log(`Found exact firstName match in 'both' mode: ${firstName}`);
          currentScore += 3;
        } else if (partialFirstNameMatchInBoth) {
          console.log(`Found partial firstName match in 'both' mode: ${firstName}`);
          currentScore += 1;
        }
        
        // Check for full name in any order (highest priority)
        if (normalizedTranscript.includes(`${firstName} ${lastName}`) ||
            normalizedTranscript.includes(`${lastName} ${firstName}`)) {
          console.log(`Found full name match: ${firstName} ${lastName}`);
          currentScore += 8; // Highest score for full name match
        }
        break;
      case 'lastName':
        // Already handled above with lastNameFound
        break;
    }
    
    // Update best match if current score is higher
    if (currentScore > bestMatchScore) {
      bestMatchScore = currentScore;
      bestMatch = student;
    }
  }
  
  // Only return a match if we have a minimum score threshold
  if (bestMatchScore >= MIN_MATCH_THRESHOLD) {
    console.log(`Best student match: ${bestMatch?.firstName} ${bestMatch?.lastName} with score ${bestMatchScore}`);
    return bestMatch;
  }
  
  console.log('No student match found in transcript or match score below threshold');
  return null;
};

export const VOICE_COMMANDS = {
  START_RECORDING: [
    'start recording',
    'begin recording',
    'start tracking',
    'begin tracking',
    'start monitoring',
    'begin monitoring',
    'start session',
    'begin session',
    'start class',
    'begin class',
    'start now',
    'let\'s start',
    'let\'s begin'
  ],
  STOP_RECORDING: [
    'stop recording',
    'end recording',
    'stop tracking',
    'end tracking',
    'stop monitoring',
    'end monitoring',
    'stop session',
    'end session',
    'stop class',
    'end class',
    'stop now',
    'that\'s all',
    'we\'re done'
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
    'presents',
    'answered',
    'responded',
    'contributed',
    'shared',
    'asked',
    'commented',
    'explained',
    'discussed',
    'presented',
    'said',
    'says',
    'speaking',
    'spoke',
    'answer',
    'response',
    'question',
    'point',
    'participation',
    'contribution'
  ],
};

export const matchVoiceCommand = (transcript: string, commands: string[]): boolean => {
  const normalizedTranscript = transcript.toLowerCase().trim();
  
  // First try exact matches
  const exactMatch = commands.some(command => normalizedTranscript === command.toLowerCase());
  if (exactMatch) {
    console.log(`Found exact voice command match in: "${normalizedTranscript}"`);
    return true;
  }
  
  // Then try partial matches
  const partialMatch = commands.some(command => normalizedTranscript.includes(command.toLowerCase()));
  if (partialMatch) {
    console.log(`Found partial voice command match in: "${normalizedTranscript}"`);
    return true;
  }
  
  // Check for word-by-word matches (helps with misrecognized words)
  const words = normalizedTranscript.split(/\s+/);
  for (const command of commands) {
    const commandWords = command.toLowerCase().split(/\s+/);
    // If at least 2 words from the command are found in the transcript
    // and they appear in the correct order, consider it a match
    if (commandWords.length >= 2) {
      let matchedWords = 0;
      let lastIndex = -1;
      
      for (const commandWord of commandWords) {
        const index = words.findIndex((word, idx) => idx > lastIndex && word.includes(commandWord));
        if (index > lastIndex) {
          matchedWords++;
          lastIndex = index;
        }
      }
      
      // If we matched at least 2 words in the correct order, consider it a match
      if (matchedWords >= 2) {
        console.log(`Found word-by-word match for command: "${command}" in: "${normalizedTranscript}"`);
        return true;
      }
    }
  }
  
  return false;
};