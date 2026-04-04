import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SimpleCache, findBookCode, getBookInfo, BIBLE_BOOKS, TRANSLATIONS } from '../bible.js';
import { CONFIG } from '../config.js';

describe('SimpleCache', () => {
  it('stores and retrieves values', () => {
    const cache = new SimpleCache<string>(10, 60000);
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('returns null for missing keys', () => {
    const cache = new SimpleCache<string>(10, 60000);
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('evicts oldest entry when max size exceeded', () => {
    const cache = new SimpleCache<string>(2, 60000);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3'); // should evict 'a'
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBe('2');
    expect(cache.get('c')).toBe('3');
    expect(cache.size).toBe(2);
  });

  it('expires entries after TTL', () => {
    const cache = new SimpleCache<string>(10, 100); // 100ms TTL
    cache.set('k', 'v');
    expect(cache.get('k')).toBe('v');

    vi.useFakeTimers();
    vi.advanceTimersByTime(150);
    expect(cache.get('k')).toBeNull();
    vi.useRealTimers();
  });

  it('clears all entries', () => {
    const cache = new SimpleCache<string>(10, 60000);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('a')).toBeNull();
  });

  it('tracks size correctly', () => {
    const cache = new SimpleCache<string>(10, 60000);
    expect(cache.size).toBe(0);
    cache.set('a', '1');
    expect(cache.size).toBe(1);
    cache.set('b', '2');
    expect(cache.size).toBe(2);
  });
});

describe('findBookCode', () => {
  it('finds by English name (case-insensitive)', () => {
    expect(findBookCode('Genesis')).toBe('gen');
    expect(findBookCode('genesis')).toBe('gen');
    expect(findBookCode('GENESIS')).toBe('gen');
  });

  it('finds by Korean name', () => {
    expect(findBookCode('창세기')).toBe('gen');
    expect(findBookCode('시편')).toBe('psa');
    expect(findBookCode('마태복음')).toBe('mat');
  });

  it('finds by 3-letter code', () => {
    expect(findBookCode('gen')).toBe('gen');
    expect(findBookCode('psa')).toBe('psa');
    expect(findBookCode('rev')).toBe('rev');
  });

  it('finds by partial match', () => {
    expect(findBookCode('psalm')).toBe('psa');
    expect(findBookCode('john')).toBe('jhn');
  });

  it('returns null for unknown books', () => {
    expect(findBookCode('xyz')).toBeNull();
    expect(findBookCode('없는책')).toBeNull();
  });
});

describe('getBookInfo', () => {
  it('returns name and Korean for valid code', () => {
    const info = getBookInfo('gen');
    expect(info).toEqual({ name: 'Genesis', korean: '창세기' });
  });

  it('returns null for invalid code', () => {
    expect(getBookInfo('zzz')).toBeNull();
  });
});

describe('findBookCode — edge cases', () => {
  it('handles empty string', () => {
    expect(findBookCode('')).toBeNull();
  });

  it('handles whitespace', () => {
    expect(findBookCode('  genesis  ')).toBe('gen');
  });

  it('finds numbered books (1 Samuel, 2 Kings, etc.)', () => {
    expect(findBookCode('1 Samuel')).toBe('1sa');
    expect(findBookCode('2 Kings')).toBe('2ki');
    expect(findBookCode('1 Corinthians')).toBe('1co');
    expect(findBookCode('3 John')).toBe('3jn');
  });

  it('finds numbered books by Korean name', () => {
    expect(findBookCode('사무엘상')).toBe('1sa');
    expect(findBookCode('열왕기하')).toBe('2ki');
    expect(findBookCode('고린도전서')).toBe('1co');
    expect(findBookCode('요한삼서')).toBe('3jn');
  });

  it('finds all NT books by Korean name', () => {
    const ntBooks = Object.entries(BIBLE_BOOKS).filter(([, v]) => v.testament === 'NT');
    for (const [, info] of ntBooks) {
      expect(findBookCode(info.korean)).toBe(info.code);
    }
  });

  it('finds all books by 3-letter code', () => {
    for (const [, info] of Object.entries(BIBLE_BOOKS)) {
      expect(findBookCode(info.code)).toBe(info.code);
    }
  });
});

describe('BIBLE_BOOKS data integrity', () => {
  const entries = Object.entries(BIBLE_BOOKS);
  const codes = entries.map(([, v]) => v.code);

  it('contains exactly 66 books', () => {
    expect(entries).toHaveLength(66);
  });

  it('has 39 OT + 27 NT books', () => {
    const ot = entries.filter(([, v]) => v.testament === 'OT');
    const nt = entries.filter(([, v]) => v.testament === 'NT');
    expect(ot).toHaveLength(39);
    expect(nt).toHaveLength(27);
  });

  it('all codes are unique', () => {
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('all codes are 3 lowercase letters', () => {
    for (const code of codes) {
      expect(code).toMatch(/^[a-z0-9]{3}$/);
    }
  });

  it('all Korean names are non-empty', () => {
    for (const [name, info] of entries) {
      expect(info.korean.length).toBeGreaterThan(0);
    }
  });

  it('all testament values are OT or NT', () => {
    for (const [, info] of entries) {
      expect(['OT', 'NT']).toContain(info.testament);
    }
  });
});

describe('TRANSLATIONS', () => {
  it('contains all 5 translation versions', () => {
    expect(Object.keys(TRANSLATIONS)).toEqual(expect.arrayContaining(['GAE', 'GAE1', 'NIR', 'KOR', 'CEV']));
    expect(Object.keys(TRANSLATIONS)).toHaveLength(5);
  });

  it('all translation names are non-empty', () => {
    for (const [, name] of Object.entries(TRANSLATIONS)) {
      expect(name.length).toBeGreaterThan(0);
    }
  });
});

describe('Retry config', () => {
  it('has sensible retry defaults', () => {
    expect(CONFIG.API.RETRY.MAX_RETRIES).toBe(3);
    expect(CONFIG.API.RETRY.INITIAL_DELAY_MS).toBe(1000);
    expect(CONFIG.API.RETRY.BACKOFF_FACTOR).toBe(2);
    expect(CONFIG.API.RETRY.MAX_DELAY_MS).toBe(5000);
  });

  it('backoff formula produces correct delays', () => {
    const { INITIAL_DELAY_MS, BACKOFF_FACTOR, MAX_DELAY_MS } = CONFIG.API.RETRY;
    const delays = [0, 1, 2, 3].map(attempt =>
      Math.min(INITIAL_DELAY_MS * Math.pow(BACKOFF_FACTOR, attempt), MAX_DELAY_MS)
    );
    expect(delays).toEqual([1000, 2000, 4000, 5000]); // capped at MAX_DELAY_MS
  });
});
