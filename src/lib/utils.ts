// eslint-disable-next-line @typescript-eslint/no-var-requires
const mdns = require('node-dns-sd');

// {
//   address: '192.168.0.114',
//   fqdn: 'corridor-waylight._esphomelib._tcp.local',
//   modelName: null,
//   familyName: null,
//   service: { port: 6053, protocol: 'tcp', type: 'esphomelib' },
//   packet: {
//     header: [Object],
//     questions: [],
//     answers: [Array],
//     authorities: [],
//     additionals: [Array],
//     address: '192.168.0.114'
//   }
// }

export async function discovery(name = '_esphomelib._tcp.local', wait = 3): Promise<any> {
  return await new Promise((resolve, reject) => {
    mdns
      .discover({
        name: name,
        wait: wait
      })
      .then((items: Array<object>) => {
        const devices: Array<object> = [];

        items
          .sort((a: any, b: any) => (a.fqdn > b.fqdn ? 1 : -1))
          .map((device: any) => {
            devices.push({
              host: device.address,
              port: device.service.port,
              fqdn: device.fqdn.replace(/_esphomelib\._tcp./gi, '')
            });
          });

        resolve(devices);
      })
      .catch((e: Error) => {
        reject(e);
      });
  });
}

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
