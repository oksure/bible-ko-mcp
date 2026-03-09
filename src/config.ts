export const CONFIG = {
  API: {
    BASE_URL: 'https://www.bskorea.or.kr/bible/korbibReadpage.php',
    TIMEOUT: 30000,
    RETRY: {
      MAX_RETRIES: 3,
      INITIAL_DELAY_MS: 1000,
      MAX_DELAY_MS: 5000,
      BACKOFF_FACTOR: 2,
    },
  },
  CACHE: {
    TTL_MS: 30 * 60 * 1000, // 30 minutes - Bible verses never change
    MAX_SIZE: 2000,
  },
  SEARCH: {
    MAX_BOOKS_TO_SEARCH: 66, // Search all books
    CHAPTERS_PER_BOOK: 10, // First 10 chapters for demo
  },
};
