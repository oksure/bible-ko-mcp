import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchChapter, verseCache, BIBLE_BOOKS, TRANSLATIONS } from '../bible.js';
import { CONFIG } from '../config.js';

// Mock node-fetch
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

import fetch from 'node-fetch';
const mockFetch = vi.mocked(fetch);

// Helper: create a mock Response with HTML containing verses
function mockResponse(html: string, ok = true, status = 200): any {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    text: () => Promise.resolve(html),
  };
}

function verseHtml(verses: [number, string][]): string {
  const spans = verses.map(([n, t]) => `<span>${n}   ${t}</span>`).join('\n');
  return `<html><body>${spans}</body></html>`;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  verseCache.clear();
});

describe('fetchChapter — HTML parsing', () => {
  it('parses verses from span elements', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(verseHtml([
      [1, '태초에 하나님이 천지를 창조하시니라'],
      [2, '땅이 혼돈하고 공허하며'],
    ])));

    const result = await fetchChapter('gen', 1);
    expect(result.verses).toHaveLength(2);
    expect(result.verses[0]).toEqual({ number: 1, text: '태초에 하나님이 천지를 창조하시니라' });
    expect(result.verses[1]).toEqual({ number: 2, text: '땅이 혼돈하고 공허하며' });
  });

  it('removes footnote markers', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(
      '<html><body><span>1   하나님이1) 세상을2) 사랑하사</span></body></html>'
    ));

    const result = await fetchChapter('jhn', 3);
    expect(result.verses[0].text).toBe('하나님이 세상을 사랑하사');
  });

  it('deduplicates verses (website duplicates)', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(verseHtml([
      [1, '처음 등장'],
      [1, '중복된 절'],
      [2, '두 번째 절'],
    ])));

    const result = await fetchChapter('gen', 1);
    expect(result.verses).toHaveLength(2);
    expect(result.verses[0].text).toBe('처음 등장');
  });

  it('strips explanatory text after newlines', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(
      '<html><body><span>1   본문 텍스트\n또는 다른 해석</span></body></html>'
    ));

    const result = await fetchChapter('gen', 1);
    expect(result.verses[0].text).toBe('본문 텍스트');
  });

  it('returns correct metadata', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(verseHtml([[1, 'test']])));

    const result = await fetchChapter('gen', 1, 'GAE');
    expect(result.book).toBe('Genesis');
    expect(result.bookKorean).toBe('창세기');
    expect(result.chapter).toBe(1);
    expect(result.version).toBe('GAE');
    expect(result.versionName).toBe(TRANSLATIONS['GAE']);
  });

  it('handles unknown book code gracefully', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(verseHtml([[1, 'text']])));

    const result = await fetchChapter('zzz', 1);
    expect(result.book).toBe('zzz');
    expect(result.bookKorean).toBe('');
  });

  it('handles empty response (no verses)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce(mockResponse('<html><body></body></html>'));

    const result = await fetchChapter('gen', 1);
    expect(result.verses).toHaveLength(0);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No verses parsed'));
    consoleSpy.mockRestore();
  });
});

describe('fetchChapter — caching', () => {
  it('caches results and returns cached on second call', async () => {
    mockFetch.mockResolvedValue(mockResponse(verseHtml([[1, 'cached verse']])));

    const first = await fetchChapter('gen', 1);
    const second = await fetchChapter('gen', 1);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it('different versions use different cache keys', async () => {
    mockFetch.mockResolvedValue(mockResponse(verseHtml([[1, 'verse']])));

    await fetchChapter('gen', 1, 'GAE');
    await fetchChapter('gen', 1, 'NIR');

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe('fetchChapter — retry logic', () => {
  it('retries on network failure and succeeds', async () => {
    const origRetry = { ...CONFIG.API.RETRY };
    CONFIG.API.RETRY.INITIAL_DELAY_MS = 1;
    CONFIG.API.RETRY.MAX_DELAY_MS = 1;

    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockResponse(verseHtml([[1, 'recovered']])));

    const result = await fetchChapter('gen', 1);
    expect(result.verses[0].text).toBe('recovered');
    expect(mockFetch).toHaveBeenCalledTimes(2);

    Object.assign(CONFIG.API.RETRY, origRetry);
  });

  it('throws after exhausting all retries', async () => {
    // Use real timers with fast CONFIG override to avoid fake timer complications
    const origRetry = { ...CONFIG.API.RETRY };
    CONFIG.API.RETRY.INITIAL_DELAY_MS = 1;
    CONFIG.API.RETRY.MAX_DELAY_MS = 1;

    const error = new Error('Persistent failure');
    mockFetch.mockRejectedValue(error);

    await expect(fetchChapter('gen', 1)).rejects.toThrow(/Failed to fetch chapter/);
    // 1 initial + 3 retries = 4 calls
    expect(mockFetch).toHaveBeenCalledTimes(4);

    // Restore
    Object.assign(CONFIG.API.RETRY, origRetry);
  });

  it('retries on HTTP error responses', async () => {
    const origRetry = { ...CONFIG.API.RETRY };
    CONFIG.API.RETRY.INITIAL_DELAY_MS = 1;
    CONFIG.API.RETRY.MAX_DELAY_MS = 1;

    mockFetch
      .mockResolvedValueOnce(mockResponse('', false, 500))
      .mockResolvedValueOnce(mockResponse(verseHtml([[1, 'ok']])));

    const result = await fetchChapter('gen', 1);
    expect(result.verses[0].text).toBe('ok');
    expect(mockFetch).toHaveBeenCalledTimes(2);

    Object.assign(CONFIG.API.RETRY, origRetry);
  });
});
