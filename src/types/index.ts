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

export interface AIActionProposal {
  id: string;
  title: string;
  description: string;
  type: 'move_activity' | 'add_activity' | 'remove_activity' | 'change_pace' | 'optimize_day';
  payload: {
    activityId?: string;
    sourceDayId?: string;
    targetDayId?: string;
    targetTime?: string;
    newActivity?: Partial<Activity>;
    newPace?: TravelPace;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  proposal?: AIActionProposal;
}
