import { Activity, DayPlan } from '../types';
import { MapService } from './MapService';

export interface OptimizationIssue {
  type: 'time_overlap' | 'tight_connection' | 'high_distance' | 'missing_meal' | 'overcrowded_day';
  severity: 'warning' | 'info';
  message: string;
  activityIds?: string[];
}

export interface DayOptimizationResult {
  dayId: string;
  dayNumber: number;
  city: string;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  issues: OptimizationIssue[];
  optimizedActivities: Activity[];
}

export interface TripOptimizationReport {
  score: number; // 0-100
  summary: string;
  daysAnalysis: DayOptimizationResult[];
  recommendedChangesCount: number;
}

export class ItineraryOptimizer {
  /**
   * Evaluates a single day and detects spatial, temporal or pacing conflicts
   */
  static analyzeDay(day: DayPlan): DayOptimizationResult {
    const issues: OptimizationIssue[] = [];
    const activities = [...day.activities].sort((a, b) => a.startTime.localeCompare(b.startTime));

    let totalDistanceKm = 0;
    let totalDurationMinutes = 0;

    for (let i = 0; i < activities.length; i++) {
      const current = activities[i];
      totalDurationMinutes += current.durationMinutes;

      if (i > 0) {
        const prev = activities[i - 1];
        const dist = MapService.calculateDistanceKm(
          prev.latitude,
          prev.longitude,
          current.latitude,
          current.longitude
        );
        totalDistanceKm += dist;

        // Check time overlaps
        if (prev.endTime > current.startTime) {
          issues.push({
            type: 'time_overlap',
            severity: 'warning',
            message: `Conflicto horario: "${prev.name}" termina a las ${prev.endTime} y "${current.name}" inicia a las ${current.startTime}.`,
            activityIds: [prev.id, current.id],
          });
        }

        // Check if travel distance between activities is unusually long for a walking itinerary (> 6km in same city without transport)
        if (dist > 6 && current.category !== 'transport' && prev.category !== 'transport') {
          issues.push({
            type: 'high_distance',
            severity: 'info',
            message: `Desplazamiento notable (${dist} km) entre "${prev.name}" y "${current.name}". Se sugiere transporte público o taxi.`,
            activityIds: [prev.id, current.id],
          });
        }
      }
    }

    if (activities.length > 5) {
      issues.push({
        type: 'overcrowded_day',
        severity: 'info',
        message: `El Día ${day.dayNumber} tiene ${activities.length} actividades programadas. Podría resultar apresurado.`,
      });
    }

    return {
      dayId: day.id,
      dayNumber: day.dayNumber,
      city: day.city,
      totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
      totalDurationMinutes,
      issues,
      optimizedActivities: this.reorderActivitiesByProximity(activities),
    };
  }

  /**
   * Reorders mid-day activities to minimize travel distance while keeping
   * breakfast/morning at start and dinner/relaxation at end.
   */
  static reorderActivitiesByProximity(activities: Activity[]): Activity[] {
    if (activities.length <= 2) return activities;

    const sorted = [...activities].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const morning = sorted[0];
    const evening = sorted[sorted.length - 1];
    const middle = sorted.slice(1, sorted.length - 1);

    // Greedy nearest-neighbor for the middle pool
    const optimizedMiddle: Activity[] = [];
    let currentPoint = { lat: morning.latitude, lng: morning.longitude };
    const remaining = [...middle];

    while (remaining.length > 0) {
      let closestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const d = MapService.calculateDistanceKm(
          currentPoint.lat,
          currentPoint.lng,
          remaining[i].latitude,
          remaining[i].longitude
        );
        if (d < minDistance) {
          minDistance = d;
          closestIdx = i;
        }
      }

      const next = remaining.splice(closestIdx, 1)[0];
      optimizedMiddle.push(next);
      currentPoint = { lat: next.latitude, lng: next.longitude };
    }

    return [morning, ...optimizedMiddle, evening];
  }

  /**
   * Generates a global diagnostic report for the trip
   */
  static generateReport(days: DayPlan[]): TripOptimizationReport {
    const daysAnalysis = days.map((day) => this.analyzeDay(day));
    const allIssues = daysAnalysis.flatMap((d) => d.issues);

    let penalty = allIssues.filter((i) => i.severity === 'warning').length * 15;
    penalty += allIssues.filter((i) => i.severity === 'info').length * 5;
    const score = Math.max(20, Math.min(100, 100 - penalty));

    let summary = 'Itinerario equilibrado y de alta viabilidad con agrupamiento geográfico armónico.';
    if (score < 60) {
      summary = 'Se detectaron solapamientos de horario o desplazamientos excesivos que convendría ajustar.';
    } else if (score < 85) {
      summary = 'Itinerario sólido con algunas oportunidades menores de optimización en conexiones.';
    }

    return {
      score,
      summary,
      daysAnalysis,
      recommendedChangesCount: allIssues.length,
    };
  }
}
