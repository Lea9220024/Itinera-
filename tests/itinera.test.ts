import { describe, it, expect, beforeEach } from 'vitest';
import { ItineraryOptimizer } from '../src/services/ItineraryOptimizer';
import { AIActionValidator } from '../src/services/AIActionValidator';
import { MigrationService, MIGRATION_VERSION_KEY, CURRENT_MIGRATION_VERSION } from '../src/services/MigrationService';
import { Trip, DayPlan, Activity } from '../src/types';

describe('Itinera Travel Planner - Core Domain & Architecture Tests', () => {
  // 1. Trip Creation & Date Calculations
  describe('Trip Creation & Date Calculations', () => {
    it('correctly calculates total days and nights between dates', () => {
      const start = '2026-06-10';
      const end = '2026-06-17';
      const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const nights = days - 1;

      expect(days).toBe(8);
      expect(nights).toBe(7);
    });

    it('handles same-day trips correctly', () => {
      const start = '2026-06-10';
      const end = '2026-06-10';
      const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const nights = Math.max(0, days - 1);

      expect(days).toBe(1);
      expect(nights).toBe(0);
    });
  });

  // 2. Budget Calculations
  describe('Budget Calculations', () => {
    it('correctly calculates actual spent, estimated total, and remaining balance', () => {
      const totalBudget = 2500;
      const expenses = [
        { amount: 300 },
        { amount: 150 },
        { amount: 50 },
      ];
      const activities = [
        { estimatedCost: 40 },
        { estimatedCost: 60 },
      ];

      const actualSpent = expenses.reduce((acc, e) => acc + e.amount, 0);
      const activitiesEstimated = activities.reduce((acc, a) => acc + a.estimatedCost, 0);
      const totalEstimated = actualSpent + activitiesEstimated;
      const remaining = totalBudget - actualSpent;

      expect(actualSpent).toBe(500);
      expect(totalEstimated).toBe(600);
      expect(remaining).toBe(2000);
    });
  });

  // 3. Activity Ordering & Movement
  describe('Activity Ordering & Movement', () => {
    const mockActivities: Activity[] = [
      {
        id: 'act-1',
        dayId: 'day-1',
        name: 'Museo',
        description: '',
        category: 'culture',
        startTime: '14:00',
        endTime: '16:00',
        durationMinutes: 120,
        location: 'Centro',
        latitude: 41.9,
        longitude: 12.4,
        estimatedCost: 15,
        currency: '€',
      },
      {
        id: 'act-2',
        dayId: 'day-1',
        name: 'Desayuno',
        description: '',
        category: 'gastronomy',
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        location: 'Bar',
        latitude: 41.91,
        longitude: 12.41,
        estimatedCost: 8,
        currency: '€',
      },
      {
        id: 'act-3',
        dayId: 'day-1',
        name: 'Cena',
        description: '',
        category: 'gastronomy',
        startTime: '20:00',
        endTime: '22:00',
        durationMinutes: 120,
        location: 'Trattoria',
        latitude: 41.92,
        longitude: 12.42,
        estimatedCost: 35,
        currency: '€',
      },
    ];

    it('sorts activities chronologically by start time', () => {
      const sorted = [...mockActivities].sort((a, b) => a.startTime.localeCompare(b.startTime));
      expect(sorted[0].name).toBe('Desayuno');
      expect(sorted[1].name).toBe('Museo');
      expect(sorted[2].name).toBe('Cena');
    });

    it('correctly transfers an activity from Day 1 to Day 2', () => {
      const day1: DayPlan = {
        id: 'day-1',
        tripId: 'trip-1',
        dayNumber: 1,
        date: '2026-06-10',
        city: 'Roma',
        activities: [...mockActivities],
      };

      const day2: DayPlan = {
        id: 'day-2',
        tripId: 'trip-1',
        dayNumber: 2,
        date: '2026-06-11',
        city: 'Roma',
        activities: [],
      };

      // Move act-1 (Museo) to Day 2
      const movedAct = day1.activities.find((a) => a.id === 'act-1')!;
      const updatedDay1 = {
        ...day1,
        activities: day1.activities.filter((a) => a.id !== 'act-1'),
      };
      const updatedDay2 = {
        ...day2,
        activities: [...day2.activities, { ...movedAct, dayId: 'day-2' }],
      };

      expect(updatedDay1.activities.length).toBe(2);
      expect(updatedDay2.activities.length).toBe(1);
      expect(updatedDay2.activities[0].id).toBe('act-1');
      expect(updatedDay2.activities[0].dayId).toBe('day-2');
    });
  });

  // 4. Itinerary Optimizer
  describe('Itinerary Optimizer Engine', () => {
    it('detects time conflicts between overlapping activities', () => {
      const overlappingDay: DayPlan = {
        id: 'day-conflicts',
        tripId: 'trip-1',
        dayNumber: 1,
        date: '2026-06-10',
        city: 'Roma',
        activities: [
          {
            id: 'act-1',
            dayId: 'day-conflicts',
            name: 'Visita guiada Coliseo',
            description: '',
            category: 'culture',
            startTime: '10:00',
            endTime: '12:30',
            durationMinutes: 150,
            location: 'Coliseo',
            latitude: 41.8902,
            longitude: 12.4922,
            estimatedCost: 25,
            currency: '€',
          },
          {
            id: 'act-2',
            dayId: 'day-conflicts',
            name: 'Almuerzo reserva',
            description: '',
            category: 'gastronomy',
            startTime: '12:00', // Conflict: starts before 12:30
            endTime: '13:30',
            durationMinutes: 90,
            location: 'Monti',
            latitude: 41.8967,
            longitude: 12.4928,
            estimatedCost: 30,
            currency: '€',
          },
        ],
      };

      const result = ItineraryOptimizer.analyzeDay(overlappingDay);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some((i) => i.type === 'time_overlap')).toBe(true);
    });

    it('generates multi-criteria structured scores and suggestions', () => {
      const sampleDays: DayPlan[] = [
        {
          id: 'day-1',
          tripId: 'trip-1',
          dayNumber: 1,
          date: '2026-06-10',
          city: 'Roma',
          activities: [
            {
              id: 'act-1',
              dayId: 'day-1',
              name: 'Café matutino',
              description: '',
              category: 'gastronomy',
              startTime: '09:00',
              endTime: '09:45',
              durationMinutes: 45,
              location: 'Panteón',
              latitude: 41.8986,
              longitude: 12.4769,
              estimatedCost: 5,
              currency: '€',
            },
            {
              id: 'act-2',
              dayId: 'day-1',
              name: 'Paseo por Navona',
              description: '',
              category: 'sightseeing',
              startTime: '10:15',
              endTime: '12:00',
              durationMinutes: 105,
              location: 'Piazza Navona',
              latitude: 41.8992,
              longitude: 12.4731,
              estimatedCost: 0,
              currency: '€',
            },
          ],
        },
      ];

      const report = ItineraryOptimizer.generateReport(sampleDays);
      expect(report.scores).toBeDefined();
      expect(report.scores.logistics).toBeGreaterThanOrEqual(0);
      expect(report.scores.pacing).toBeGreaterThanOrEqual(0);
      expect(report.scores.budget).toBeGreaterThanOrEqual(0);
      expect(report.scores.distribution).toBeGreaterThanOrEqual(0);
      expect(report.scores.overall).toBeGreaterThanOrEqual(0);
      expect(report.scores.overall).toBeLessThanOrEqual(100);
    });
  });

  // 5. AI Action Schema Validation
  describe('AI Action Schema Validation', () => {
    it('validates a correct ADD_ACTIVITY action proposal', () => {
      const validPayload = {
        targetDayId: 'day-1',
        newActivity: {
          name: 'Paseo en Trastevere',
          description: 'Caminata nocturna con aperitivo',
          category: 'gastronomy',
          startTime: '19:00',
          endTime: '21:00',
          durationMinutes: 120,
          location: 'Trastevere',
          estimatedCost: 25,
        },
      };

      const result = AIActionValidator.validateActionProposal('ADD_ACTIVITY', validPayload);
      expect(result.valid).toBe(true);
      expect(result.cleanPayload.newActivity.name).toBe('Paseo en Trastevere');
    });

    it('rejects an ADD_ACTIVITY proposal with invalid time format', () => {
      const invalidPayload = {
        targetDayId: 'day-1',
        newActivity: {
          name: 'Paseo',
          startTime: '25:99', // Invalid time
          endTime: '11:00',
          durationMinutes: 60,
        },
      };

      const result = AIActionValidator.validateActionProposal('ADD_ACTIVITY', invalidPayload);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('validates a MOVE_ACTIVITY proposal', () => {
      const movePayload = {
        activityId: 'act-101',
        sourceDayId: 'day-1',
        targetDayId: 'day-3',
      };

      const result = AIActionValidator.validateActionProposal('MOVE_ACTIVITY', movePayload);
      expect(result.valid).toBe(true);
      expect(result.cleanPayload.activityId).toBe('act-101');
    });

    it('validates an UPDATE_BUDGET proposal', () => {
      const budgetPayload = { newBudget: 3200 };
      const result = AIActionValidator.validateActionProposal('UPDATE_BUDGET', budgetPayload);
      expect(result.valid).toBe(true);
      expect(result.cleanPayload.newBudget).toBe(3200);
    });

    it('rejects an UPDATE_BUDGET proposal with negative amount', () => {
      const invalidBudget = { newBudget: -50 };
      const result = AIActionValidator.validateActionProposal('UPDATE_BUDGET', invalidBudget);
      expect(result.valid).toBe(false);
    });
  });

  // 6. localStorage & Migration Integrity
  describe('localStorage & Migration Verification', () => {
    it('exposes correct migration version constant', () => {
      expect(MIGRATION_VERSION_KEY).toBe('itinera_migration_version');
      expect(CURRENT_MIGRATION_VERSION).toBe('2.0.0');
    });

    it('identifies when migration version matches current version', async () => {
      const status = await MigrationService.checkMigrationStatus();
      expect(status).toHaveProperty('hasLocalData');
      expect(status).toHaveProperty('isMigrated');
    });
  });
});
