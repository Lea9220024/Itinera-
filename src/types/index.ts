export type TripStatus = 'planning' | 'upcoming' | 'ongoing' | 'completed';

export type TravelPace = 'relax' | 'balanced' | 'intense';

export type BudgetTier = 'budget' | 'medium' | 'comfort' | 'luxury' | 'custom';

export type ActivityCategory =
  | 'culture'
  | 'gastronomy'
  | 'nature'
  | 'sightseeing'
  | 'relaxation'
  | 'adventure'
  | 'shopping'
  | 'transport'
  | 'lodging';

export type ExpenseCategory =
  | 'lodging'
  | 'transport'
  | 'transfers'
  | 'food'
  | 'activities'
  | 'shopping'
  | 'other';

export interface Activity {
  id: string;
  dayId: string;
  name: string;
  description: string;
  category: ActivityCategory;
  startTime: string; // e.g. "09:30"
  endTime: string;   // e.g. "11:30"
  durationMinutes: number;
  location: string;
  latitude: number;
  longitude: number;
  estimatedCost: number;
  currency: string;
  notes?: string;
  completed?: boolean;
  distanceFromPreviousKm?: number;
  sortOrder?: number;
}

export interface DayPlan {
  id: string;
  tripId: string;
  dayNumber: number;
  date: string; // ISO date string YYYY-MM-DD
  city: string;
  theme?: string;
  activities: Activity[];
}

export interface Expense {
  id: string;
  tripId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  date: string;
  paidBy?: string;
}

export interface Place {
  id: string;
  name: string;
  category: ActivityCategory;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  rating: number;
  estimatedCost: number;
  imageUrl?: string;
}

export interface ChecklistItem {
  id: string;
  tripId: string;
  phase: 'before' | 'during';
  category: string;
  title: string;
  completed: boolean;
  notes?: string;
}

export interface Memory {
  id: string;
  tripId: string;
  date: string;
  location: string;
  title: string;
  note: string;
  rating: number;
  imageUrl?: string;
  tags: string[];
}

export interface TravelersConfig {
  adults: number;
  children: number;
  profile?: 'solo' | 'couple' | 'friends' | 'family';
}

export interface UserPreferences {
  gastronomy: number; // 1-10
  nature: number;
  history: number;
  relax: number;
  adventure: number;
  culture: number;
  preferredCurrency: string;
  language: string;
}

export interface Trip {
  id: string;
  userId?: string; // Authenticated user owner in Supabase
  name: string;
  destination: string;
  destinationsList: string[]; // e.g. ['Roma', 'Florencia', 'Venecia', 'Milán']
  country: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalNights: number;
  travelers: TravelersConfig;
  budgetTotal: number;
  budgetTier: BudgetTier;
  currency: string;
  pace: TravelPace;
  interests: string[];
  status: TripStatus;
  coverImage: string;
  summary?: string;
  days: DayPlan[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  memories: Memory[];
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// AI Structured Actions & Proposals
// -------------------------------------------------------------
export type AIActionType =
  | 'NONE'
  | 'ADD_ACTIVITY'
  | 'MOVE_ACTIVITY'
  | 'DELETE_ACTIVITY'
  | 'UPDATE_ACTIVITY'
  | 'ADD_DAY'
  | 'REMOVE_DAY'
  | 'OPTIMIZE_DAY'
  | 'UPDATE_BUDGET';

export interface AIActionProposal {
  id: string;
  title: string;
  description: string;
  type: AIActionType;
  payload: {
    tripId?: string;
    activityId?: string;
    sourceDayId?: string;
    targetDayId?: string;
    targetTime?: string;
    newActivity?: Partial<Activity>;
    newPace?: TravelPace;
    newBudget?: number;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  proposal?: AIActionProposal;
}

// -------------------------------------------------------------
// Auth Models
// -------------------------------------------------------------
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

// -------------------------------------------------------------
// Database Representation Types (matching Supabase Schema)
// -------------------------------------------------------------
export interface DbProfile {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTrip {
  id: string;
  user_id: string;
  name: string;
  destination: string;
  description: string | null;
  start_date: string;
  end_date: string;
  travelers_count: number;
  budget_amount: number;
  budget_currency: string;
  travel_style: string;
  status: string;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTripDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  city: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbActivity {
  id: string;
  trip_day_id: string;
  name: string;
  description: string | null;
  category: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  location_name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  estimated_cost: number;
  currency: string;
  notes: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbExpense {
  id: string;
  trip_id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface DbChecklistItem {
  id: string;
  trip_id: string;
  title: string;
  category: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbMemory {
  id: string;
  trip_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  date: string;
  location: string | null;
  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------------
// Structured Optimizer Models
// -------------------------------------------------------------
export interface OptimizationScores {
  logistics: number;
  pacing: number;
  budget: number;
  distribution: number;
  overall: number;
}

// -------------------------------------------------------------
// App Errors Hierarchy
// -------------------------------------------------------------
export class AppError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

export class StorageError extends AppError {
  constructor(message: string) {
    super(message, 'STORAGE_ERROR');
    this.name = 'StorageError';
  }
}

export class AIError extends AppError {
  constructor(message: string) {
    super(message, 'AI_ERROR');
    this.name = 'AIError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
