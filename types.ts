
export enum TeachingMode {
  MIXED = 'Arabic/English',
  ENGLISH_ONLY = 'English Only'
}

export interface Unit {
  id: number;
  title: string;
  subtitle: string;
  vocabulary: string[];
  phonics: string[];
  languageInUse: string;
  lifeSkills: string[];
  color: string;
}

export interface Message {
  role: 'teacher' | 'user';
  text: string;
  audio?: string;
  isLoading?: boolean;
}

export type LessonStep = 
  | 'WARM_UP'
  | 'VOCABULARY'
  | 'PRONUNCIATION'
  | 'PHONICS'
  | 'SONG'
  | 'ACTIVITY'
  | 'REVISION';
