export interface SystemStatus {
  overallStatus: string;
  timestamp: string;
  jvm: { uptimeMs: number; totalMemoryBytes: number; freeMemoryBytes: number; usedMemoryBytes: number; maxMemoryBytes: number; availableProcessors: number };
  database: { status: string; responseTimeMs: number; databaseProductName: string | null };
  connectionPool: { poolName: string | null; activeConnections: number | null; idleConnections: number | null;
    totalConnections: number | null; threadsAwaitingConnection: number | null; maximumPoolSize: number | null } | null;
}

function integer(value: unknown, minimum = 0): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) throw new Error('Chỉ số hệ thống không hợp lệ.');
  return value;
}
const optionalCount = (value: unknown) => value == null ? null : integer(value);
const text = (value: unknown) => typeof value === 'string' && value.trim() ? value : null;

export const bytesToMB = (bytes: number) => bytes / 1_000_000;

export function readSystemStatus(payload: any): SystemStatus {
  if (payload?.success === false) throw new Error('Không thể tải trạng thái hệ thống.');
  const data = payload?.data ?? payload;
  if (!text(data?.overallStatus) || !text(data?.timestamp) || !Number.isFinite(Date.parse(data.timestamp))
    || !text(data.database?.status)) throw new Error('Phản hồi trạng thái hệ thống không hợp lệ.');
  const jvm = data.jvm;
  const pool = data.connectionPool;
  return {
    overallStatus: data.overallStatus, timestamp: data.timestamp,
    jvm: { uptimeMs: integer(jvm?.uptimeMs), totalMemoryBytes: integer(jvm?.totalMemoryBytes),
      freeMemoryBytes: integer(jvm?.freeMemoryBytes), usedMemoryBytes: integer(jvm?.usedMemoryBytes),
      maxMemoryBytes: integer(jvm?.maxMemoryBytes), availableProcessors: integer(jvm?.availableProcessors) },
    database: { status: data.database.status, responseTimeMs: integer(data.database.responseTimeMs, -1),
      databaseProductName: text(data.database.databaseProductName) },
    connectionPool: pool == null ? null : { poolName: text(pool.poolName),
      activeConnections: optionalCount(pool.activeConnections), idleConnections: optionalCount(pool.idleConnections),
      totalConnections: optionalCount(pool.totalConnections), threadsAwaitingConnection: optionalCount(pool.threadsAwaitingConnection),
      maximumPoolSize: optionalCount(pool.maximumPoolSize) },
  };
}
