export const REQUEST_COUNT = 10;
export const DEFAULT_TIMEOUT_MS = 30_000;

export const FETCH_CLIENT = Symbol('FETCH_CLIENT');

export type FetchClient = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;
