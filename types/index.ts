export type EventCategory = 'Talk' | 'Workshop' | 'Club' | 'Exam' | 'Other';

export type EventStatus = 'draft' | 'published' | 'cancelled';

export type RegistrationStatus = 'confirmed' | 'cancelled';

export type LLMResultType = 'search' | 'recommendation' | 'planning' | 'qa';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  startDateTime: string;
  endDateTime?: string;
  locationName: string;
  locationAddress?: string;
  organizerName: string;
  capacity?: number;
  registeredCount: number;
  imageUrl?: string;
  tags?: string[];
  status: EventStatus;
  createdAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  createdAt: string;
  status: RegistrationStatus;
}

export interface Favorite {
  eventId: string;
  userId: string;
  createdAt: string;
}

export interface LLMResult {
  id: string;
  eventId?: string;
  userId: string;
  type: LLMResultType;
  inputText: string;
  outputText: string;
  createdAt: string;
}

export interface User {
  email: string;
  role: 'admin' | 'student';
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}
