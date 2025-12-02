export const Status: {[key: string]: any} = {
  error: {
    fill: 'red',
    shape: 'dot',
    text: 'error'
  },
  disconnected: {
    fill: 'red',
    shape: 'ring',
    text: 'disconnected'
  },
  connecting: {
    fill: 'yellow',
    shape: 'ring',
    text: 'connecting'
  },
  connected: {
    fill: 'green',
    shape: 'dot',
    text: 'connected'
  }
} as const;

export const LogLevel: {[key: number]: string} = {
  0: 'NONE',
  1: 'ERROR',
  2: 'WARN',
  3: 'INFO',
  4: 'CONFIG',
  5: 'DEBUG',
  6: 'VERBOSE',
  7: 'VERY_VERBOSE'
} as const;

export function roundToX(num: number, X: number): number {
  return Number(Math.round(Number(`${num}e+${X}`)) + `e-${X}`);
}
