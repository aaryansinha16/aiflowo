type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const isProduction = process.env.NODE_ENV === 'production';
const envLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel | undefined) ?? undefined;

const resolveMinLevel = (): LogLevel => {
  if (envLevel && envLevel in LEVEL_RANK) return envLevel;
  return isProduction ? 'warn' : 'debug';
};

const minRank = LEVEL_RANK[resolveMinLevel()];

const sinkFor = (level: LogLevel): ((...args: unknown[]) => void) => {
  if (level === 'error') return console.error.bind(console);
  if (level === 'warn') return console.warn.bind(console);
  if (level === 'info') return console.info.bind(console);
  return console.debug.bind(console);
};

const formatPrefix = (scope: string | undefined, level: LogLevel): string => {
  const ts = new Date().toISOString();
  const tag = scope ? `[${scope}]` : '';
  return `${ts} ${level.toUpperCase()} ${tag}`.trim();
};

export interface Logger {
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => void;
  child: (childScope: string) => Logger;
}

const buildLogger = (scope?: string): Logger => {
  const emit = (level: LogLevel, message: string, payload?: unknown) => {
    if (LEVEL_RANK[level] < minRank) return;
    const prefix = formatPrefix(scope, level);
    if (payload === undefined) {
      sinkFor(level)(`${prefix} ${message}`);
    } else {
      sinkFor(level)(`${prefix} ${message}`, payload);
    }
  };

  return {
    debug: (message, meta) => emit('debug', message, meta),
    info: (message, meta) => emit('info', message, meta),
    warn: (message, meta) => emit('warn', message, meta),
    error: (message, error, meta) => {
      const payload = error !== undefined || meta !== undefined ? { error, ...(meta ?? {}) } : undefined;
      emit('error', message, payload);
    },
    child: (childScope) => buildLogger(scope ? `${scope}:${childScope}` : childScope),
  };
};

export const logger: Logger = buildLogger();

export const createLogger = (scope: string): Logger => buildLogger(scope);

