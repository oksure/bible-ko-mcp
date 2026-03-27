import { z } from 'zod';

export const getChapterSchema = z.object({
  book: z.string().min(1),
  chapter: z.number().positive().int(),
  version: z.enum(['GAE', 'GAE1', 'NIR', 'KOR', 'CEV']).optional(),
});

export const getVersesSchema = z.object({
  book: z.string().min(1),
  chapter: z.number().positive().int(),
  verseStart: z.number().positive().int(),
  verseEnd: z.number().positive().int().optional(),
  version: z.enum(['GAE', 'GAE1', 'NIR', 'KOR', 'CEV']).optional(),
}).refine(
  (data) => !data.verseEnd || data.verseEnd >= data.verseStart,
  { message: "verseEnd must be >= verseStart", path: ["verseEnd"] }
);

export const searchBibleSchema = z.object({
  query: z.string().min(1),
  version: z.enum(['GAE', 'GAE1', 'NIR', 'KOR', 'CEV']).optional(),
});

export const listBooksSchema = z.object({
  testament: z.enum(['OT', 'NT']).optional(),
});

export const compareTranslationsSchema = z.object({
  book: z.string().min(1),
  chapter: z.number().positive().int(),
  verse: z.number().positive().int(),
  versions: z.array(z.enum(['GAE', 'GAE1', 'NIR', 'KOR', 'CEV'])).optional(),
});

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown, context: string): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation error for ${context}: ${errorMessages}`);
    }
    throw error;
  }
}
