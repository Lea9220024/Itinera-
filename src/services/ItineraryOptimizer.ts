import { Activity, DayPlan, Trip, OptimizationScores } from '../types';
import { MapService } from './MapService';

export interface OptimizationIssue {
  type: 'time_overlap' | 'tight_connection' | 'high_distance' | 'missing_meal' | 'overcrowded_day';
  severity: 'warning' | 'info';
  message: string;
  activityIds?: string[];
}

export interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  category: 'logistics' | 'pacing' | 'budget' | 'distribution';
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
  scores: OptimizationScores;
  summary: string;
  daysAnalysis: DayOptimizationResult[];
  suggestions: OptimizationSuggestion[];
  recommendedChangesCount: number;
}

export class ItineraryOptimizer {
  /**
   * Analyzes an individual day of the trip for geographic and temporal integrity
   */
  static analyzeDay(day: DayPlan): DayOptimizationResult {
    const issues: OptimizationIssue[] = [];
    const activities = [...(day.activities || [])].sort((a, b) => a.startTime.localeCompare(b.startTime));

    let totalDistanceKm = 0;
    let totalDurationMinutes = 0;

    for (let i = 0; i < activities.length; i++) {
      const current = activities[i];
      totalDurationMinutes += current.durationMinutes || 60;

      if (i > 0) {
        const prev = activities[i - 1];
        const dist = MapService.calculateDistanceKm(
          prev.latitude || 41.9,
          prev.longitude || 12.4,
          current.latitude || 41.9,
          current.longitude || 12.4
        );
        totalDistanceKm += dist;

        // Check time overlap
        if (prev.endTime > current.startTime) {
          issues.push({
            type: 'time_overlap',
            severity: 'warning',
            message: `Conflicto horario: "${prev.name}" finaliza a las ${prev.endTime} y "${current.name}" inicia a las ${current.startTime}.`,
            activityIds: [prev.id, current.id],
          });
        }

        // Check high walking distance without transport
        if (dist > 6 && current.category !== 'transport' && prev.category !== 'transport') {
          issues.push({
            type: 'high_distance',
            severity: 'info',
            message: `Desplazamiento notable (${dist} km) entre "${prev.name}" y "${current.name}". Se sugiere transporte público.`,
            activityIds: [prev.id, current.id],
          });
        }
      }
    }

    if (activities.length > 5) {
      issues.push({
        type: 'overcrowded_day',
        severity: 'info',
        message: `El Día ${day.dayNumber} tiene ${activities.length} actividades. Puede resultar apresurado.`,
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

    const optimizedMiddle: Activity[] = [];
    let currentPoint = { lat: morning.latitude || 41.9, lng: morning.longitude || 12.4 };
    const remaining = [...middle];

    while (remaining.length > 0) {
      let closestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const d = MapService.calculateDistanceKm(
          currentPoint.lat,
          currentPoint.lng,
          remaining[i].latitude || 41.9,
          remaining[i].longitude || 12.4
        );
        if (d < minDistance) {
          minDistance = d;
          closestIdx = i;
        }
      }

      const next = remaining.splice(closestIdx, 1)[0];
      optimizedMiddle.push(next);
      currentPoint = { lat: next.latitude || 41.9, lng: next.longitude || 12.4 };
    }

    return [morning, ...optimizedMiddle, evening];
  }

  /**
   * Generates a comprehensive multi-criteria diagnostic report for the trip
   */
  static generateReport(days: DayPlan[], trip?: Trip): TripOptimizationReport {
    const daysAnalysis = days.map((day) => this.analyzeDay(day));
    const allIssues = daysAnalysis.flatMap((d) => d.issues);
    const suggestions: OptimizationSuggestion[] = [];

    // 1. Logistics Score
    let logisticsDeductions = 0;
    allIssues.forEach((issue) => {
      if (issue.type === 'time_overlap') logisticsDeductions += 15;
      if (issue.type === 'high_distance') logisticsDeductions += 8;
      if (issue.type === 'tight_connection') logisticsDeductions += 5;
    });
    const logisticsScore = Math.max(30, Math.min(100, 100 - logisticsDeductions));

    // 2. Pacing Score
    let pacingDeductions = 0;
    daysAnalysis.forEach((d) => {
      if (d.totalDurationMinutes > 480) pacingDeductions += 10; // >8h active
      if (d.issues.some((i) => i.type === 'overcrowded_day')) pacingDeductions += 8;
    });
    const pacingScore = Math.max(30, Math.min(100, 100 - pacingDeductions));

    // 3. Distribution Score
    const activityCounts = days.map((d) => d.activities.length);
    const maxActs = Math.max(...activityCounts, 1);
    const minActs = Math.min(...activityCounts, 0);
    const spread = maxActs - minActs;
    const distributionScore = Math.max(40, Math.min(100, 100 - spread * 6));

    // 4. Budget Score
    let budgetScore = 85;
    if (trip) {
      const estimatedActivitiesSum = days.reduce(
        (sum, d) => sum + d.activities.reduce((aSum, a) => aSum + (a.estimatedCost || 0), 0),
        0
      );
      if (estimatedActivitiesSum > trip.budgetTotal) {
        budgetScore = Math.max(35, Math.round((trip.budgetTotal / estimatedActivitiesSum) * 100));
        suggestions.push({
          id: 'sugg-budget',
          title: 'Presupuesto ajustado',
          description: `El coste estimado de las actividades (${trip.currency}${estimatedActivitiesSum}) supera el presupuesto total fijado (${trip.currency}${trip.budgetTotal}).`,
          category: 'budget',
        });
      } else {
        budgetScore = 92;
      }
    }

    // Weighted Overall Score
    const overallScore = Math.round(
      logisticsScore * 0.35 + pacingScore * 0.25 + distributionScore * 0.2 + budgetScore * 0.2
    );

    // Suggestions
    if (logisticsScore < 80) {
      suggestions.push({
        id: 'sugg-logistics',
        title: 'Optimización de trayectos',
        description: 'Reagrupar visitas contiguas para reducir tiempos de traslado a pie.',
        category: 'logistics',
      });
    }

    if (pacingScore < 80) {
      suggestions.push({
        id: 'sugg-pacing',
        title: 'Espacios de descanso recomendados',
        description: 'Se detectaron jornadas con más de 7 horas continuas de visitas. Añadir pausas para café o descanso.',
        category: 'pacing',
      });
    }

    let summary = 'Itinerario de alta viabilidad y excelente distribución geográfica y temporal.';
    if (overallScore < 70) {
      summary = 'Se encontraron fricciones de horario y distancias que convendría optimizar.';
    } else if (overallScore < 85) {
      summary = 'Itinerario equilibrado con oportunidades menores de mejora en tiempos de traslado.';
    }

    return {
      scores: {
        logistics: logisticsScore,
        pacing: pacingScore,
        budget: budgetScore,
        distribution: distributionScore,
        overall: overallScore,
      },
      summary,
      daysAnalysis,
      suggestions,
      recommendedChangesCount: allIssues.length,
    };
  }
}
