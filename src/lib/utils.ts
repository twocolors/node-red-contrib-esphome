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
