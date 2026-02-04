/**
 * Logger utility using Pino
 */

import pino, { type Logger as PinoLogger, type LoggerOptions } from 'pino';
import type { LogLevel } from '../types/index.js';

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

export function createLogger(
  level: LogLevel = 'info',
  options: Partial<LoggerOptions> = {}
): PinoLogger {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const config: LoggerOptions = {
    level,
    ...options,
  };

  if (isDevelopment) {
    // Pretty print in development
    config.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        messageFormat: '{msg} {context}',
      },
    };
  } else {
    // JSON logs in production
    config.formatters = {
      level: (label: string) => ({ level: label }),
    };
    config.timestamp = pino.stdTimeFunctions.isoTime;
  }

  return pino(config);
}

export function getLogLevelFromEnv(): LogLevel {
  const envLevel = process.env.CLAUDENEST_LOG_LEVEL;
  if (envLevel && envLevel in LOG_LEVELS) {
    return envLevel as LogLevel;
  }
  return 'info';
}

export { type PinoLogger as Logger };
