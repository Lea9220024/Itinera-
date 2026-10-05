import { z } from 'zod';
import { AIActionProposal, AIActionType } from '../types';

export const AIActionTypeEnum = z.enum([
  'NONE',
  'ADD_ACTIVITY',
  'MOVE_ACTIVITY',
  'DELETE_ACTIVITY',
  'UPDATE_ACTIVITY',
  'ADD_DAY',
  'REMOVE_DAY',
  'OPTIMIZE_DAY',
  'UPDATE_BUDGET',
]);

const AddActivityPayloadSchema = z.object({
  targetDayId: z.string().optional(),
  dayNumber: z.number().int().positive().optional(),
  newActivity: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(300).optional(),
    category: z.enum([
      'culture',
      'gastronomy',
      'nature',
      'sightseeing',
      'relaxation',
      'adventure',
      'shopping',
      'transport',
      'lodging',
    ]).default('sightseeing'),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('10:00'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('11:30'),
    durationMinutes: z.number().min(15).max(720).default(90),
    location: z.string().max(120).default('Centro'),
    estimatedCost: z.number().min(0).max(50000).default(0),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    notes: z.string().max(200).optional(),
  }),
});

const MoveActivityPayloadSchema = z.object({
  activityId: z.string().min(1),
  sourceDayId: z.string().optional(),
  targetDayId: z.string().min(1),
  targetTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});

const DeleteActivityPayloadSchema = z.object({
  activityId: z.string().min(1),
  dayId: z.string().optional(),
});

const UpdateBudgetPayloadSchema = z.object({
  newBudget: z.number().min(50).max(1000000),
});

export const StructuredAIResponseSchema = z.object({
  message: z.string().min(1),
  action: AIActionTypeEnum.default('NONE'),
  title: z.string().optional(),
  description: z.string().optional(),
  payload: z.record(z.string(), z.any()).optional().default({}),
});

export type StructuredAIResponse = z.infer<typeof StructuredAIResponseSchema>;

export class AIActionValidator {
  /**
   * Validates raw AI output against the expected schema with resilient fallback
   */
  static validateResponse(raw: unknown): StructuredAIResponse {
    try {
      return StructuredAIResponseSchema.parse(raw);
    } catch {
      if (raw && typeof raw === 'object' && 'message' in (raw as any)) {
        return {
          message: String((raw as any).message || 'Respuesta recibida del asistente.'),
          action: 'NONE',
          payload: {},
        };
      }
      return {
        message: typeof raw === 'string' ? raw : 'No se pudo interpretar la respuesta del asistente.',
        action: 'NONE',
        payload: {},
      };
    }
  }

  /**
   * Validates whether an action proposal payload satisfies domain integrity constraints
   */
  static validateActionProposal(
    action: AIActionType,
    payload: any
  ): { valid: boolean; error?: string; cleanPayload?: any } {
    try {
      if (action === 'NONE') {
        return { valid: true, cleanPayload: {} };
      }

      if (action === 'ADD_ACTIVITY') {
        const parsed = AddActivityPayloadSchema.parse(payload);
        return { valid: true, cleanPayload: parsed };
      }

      if (action === 'MOVE_ACTIVITY') {
        const parsed = MoveActivityPayloadSchema.parse(payload);
        return { valid: true, cleanPayload: parsed };
      }

      if (action === 'DELETE_ACTIVITY') {
        const parsed = DeleteActivityPayloadSchema.parse(payload);
        return { valid: true, cleanPayload: parsed };
      }

      if (action === 'UPDATE_BUDGET') {
        const parsed = UpdateBudgetPayloadSchema.parse(payload);
        return { valid: true, cleanPayload: parsed };
      }

      // Default fallback for other action types
      return { valid: true, cleanPayload: payload };
    } catch (err: any) {
      return {
        valid: false,
        error:
          err instanceof z.ZodError
            ? (err.issues || []).map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
            : err.message,
      };
    }
  }
}
