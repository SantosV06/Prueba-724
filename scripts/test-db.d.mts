export interface TestDatabase {
  waitReady: Promise<unknown>;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
  exec(text: string): Promise<unknown>;
  close(): Promise<void>;
}
export function testDatabase(): TestDatabase;
