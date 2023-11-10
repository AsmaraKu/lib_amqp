export type LoggerType = {
  debug: (msg: string, ...obj: readonly unknown[]) => unknown;
  info: (msg: string, ...obj: readonly unknown[]) => unknown;
  warn: (msg: string, ...obj: readonly unknown[]) => unknown;
  error: (msg: string, ...obj: readonly unknown[]) => unknown;
};
