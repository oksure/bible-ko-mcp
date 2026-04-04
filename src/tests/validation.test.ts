import { describe, it, expect } from 'vitest';
import {
  getChapterSchema, getVersesSchema, searchBibleSchema,
  listBooksSchema, compareTranslationsSchema, validateInput,
} from '../validation.js';

describe('getChapterSchema', () => {
  it('accepts valid input', () => {
    expect(getChapterSchema.parse({ book: 'Genesis', chapter: 1 }))
      .toEqual({ book: 'Genesis', chapter: 1 });
  });

  it('accepts input with version', () => {
    expect(getChapterSchema.parse({ book: '창세기', chapter: 3, version: 'GAE' }))
      .toEqual({ book: '창세기', chapter: 3, version: 'GAE' });
  });

  it('rejects empty book', () => {
    expect(() => getChapterSchema.parse({ book: '', chapter: 1 })).toThrow();
  });

  it('rejects non-positive chapter', () => {
    expect(() => getChapterSchema.parse({ book: 'Genesis', chapter: 0 })).toThrow();
    expect(() => getChapterSchema.parse({ book: 'Genesis', chapter: -1 })).toThrow();
  });

  it('rejects non-integer chapter', () => {
    expect(() => getChapterSchema.parse({ book: 'Genesis', chapter: 1.5 })).toThrow();
  });

  it('rejects invalid version enum', () => {
    expect(() => getChapterSchema.parse({ book: 'Genesis', chapter: 1, version: 'INVALID' })).toThrow();
  });
});

describe('getVersesSchema', () => {
  it('accepts valid input with start only', () => {
    const result = getVersesSchema.parse({ book: 'John', chapter: 3, verseStart: 16 });
    expect(result.verseStart).toBe(16);
    expect(result.verseEnd).toBeUndefined();
  });

  it('accepts valid range', () => {
    const result = getVersesSchema.parse({ book: 'John', chapter: 3, verseStart: 16, verseEnd: 18 });
    expect(result.verseStart).toBe(16);
    expect(result.verseEnd).toBe(18);
  });

  it('accepts same start and end', () => {
    expect(() => getVersesSchema.parse({ book: 'John', chapter: 3, verseStart: 5, verseEnd: 5 })).not.toThrow();
  });

  it('rejects verseEnd < verseStart', () => {
    expect(() => getVersesSchema.parse({ book: 'John', chapter: 3, verseStart: 10, verseEnd: 5 })).toThrow();
  });

  it('rejects non-positive verseStart', () => {
    expect(() => getVersesSchema.parse({ book: 'John', chapter: 3, verseStart: 0 })).toThrow();
  });
});

describe('searchBibleSchema', () => {
  it('accepts valid query', () => {
    expect(searchBibleSchema.parse({ query: '사랑' })).toEqual({ query: '사랑' });
  });

  it('accepts query with version', () => {
    expect(searchBibleSchema.parse({ query: 'love', version: 'CEV' }))
      .toEqual({ query: 'love', version: 'CEV' });
  });

  it('rejects empty query', () => {
    expect(() => searchBibleSchema.parse({ query: '' })).toThrow();
  });
});

describe('listBooksSchema', () => {
  it('accepts no testament (all books)', () => {
    expect(listBooksSchema.parse({})).toEqual({});
  });

  it('accepts OT/NT', () => {
    expect(listBooksSchema.parse({ testament: 'OT' })).toEqual({ testament: 'OT' });
    expect(listBooksSchema.parse({ testament: 'NT' })).toEqual({ testament: 'NT' });
  });

  it('rejects invalid testament', () => {
    expect(() => listBooksSchema.parse({ testament: 'ALL' })).toThrow();
  });
});

describe('compareTranslationsSchema', () => {
  it('accepts valid input', () => {
    const result = compareTranslationsSchema.parse({ book: 'John', chapter: 3, verse: 16 });
    expect(result.verse).toBe(16);
  });

  it('accepts with specific versions', () => {
    const result = compareTranslationsSchema.parse({
      book: 'John', chapter: 3, verse: 16, versions: ['GAE', 'NIR'],
    });
    expect(result.versions).toEqual(['GAE', 'NIR']);
  });

  it('rejects invalid version in array', () => {
    expect(() => compareTranslationsSchema.parse({
      book: 'John', chapter: 3, verse: 16, versions: ['GAE', 'WRONG'],
    })).toThrow();
  });
});

describe('validateInput', () => {
  it('returns parsed value on valid input', () => {
    const result = validateInput(getChapterSchema, { book: 'Genesis', chapter: 1 }, 'test');
    expect(result).toEqual({ book: 'Genesis', chapter: 1 });
  });

  it('throws formatted error on invalid input', () => {
    expect(() => validateInput(getChapterSchema, { book: '', chapter: -1 }, 'get-chapter'))
      .toThrow(/Validation error for get-chapter/);
  });

  it('includes field path in error message', () => {
    try {
      validateInput(getChapterSchema, { book: '', chapter: 1 }, 'test');
    } catch (e: any) {
      expect(e.message).toContain('book');
    }
  });
});
