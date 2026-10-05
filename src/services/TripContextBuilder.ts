import { Trip, UserPreferences } from '../types';

export interface MinimalTripContext {
  destination: string;
  totalDays: number;
  startDate: string;
  endDate: string;
  travelers: {
    count: number;
    profile: string;
  };
  budget: {
    total: number;
    currency: string;
    tier: string;
  };
  pace: string;
  interests: string[];
  daysOverview: {
    dayNumber: number;
    dayId: string;
    city: string;
    date: string;
    activities: {
      id: string;
      name: string;
      category: string;
      time: string;
      cost: number;
    }[];
  }[];
}

export class TripContextBuilder {
  /**
   * Sanitizes text strings to prevent prompt injection from stored user data.
   */
  private static sanitize(text: string): string {
    return text.replace(/[<>{}|\\]/g, ' ').slice(0, 150);
  }

  /**
   * Constructs the minimal, privacy-conscious context payload for the AI model.
   */
  static build(trip: Trip, preferences?: UserPreferences): MinimalTripContext {
    return {
      destination: this.sanitize(trip.destination),
      totalDays: trip.totalDays,
      startDate: trip.startDate,
      endDate: trip.endDate,
      travelers: {
        count: (trip.travelers?.adults || 2) + (trip.travelers?.children || 0),
        profile: trip.travelers?.profile || 'pareja',
      },
      budget: {
        total: trip.budgetTotal,
        currency: trip.currency,
        tier: trip.budgetTier,
      },
      pace: trip.pace,
      interests: (trip.interests || []).map((i) => this.sanitize(i)),
      daysOverview: (trip.days || []).map((day) => ({
        dayNumber: day.dayNumber,
        dayId: day.id,
        city: this.sanitize(day.city),
        date: day.date,
        activities: (day.activities || []).map((act) => ({
          id: act.id,
          name: this.sanitize(act.name),
          category: act.category,
          time: `${act.startTime} - ${act.endTime}`,
          cost: act.estimatedCost || 0,
        })),
      })),
    };
  }
}
