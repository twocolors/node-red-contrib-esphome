"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Status = exports.discovery = void 0;
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
function discovery(name = '_esphomelib._tcp.local', wait = 3) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Promise((resolve, reject) => {
            mdns
                .discover({
                name: name,
                wait: wait
            })
                .then((items) => {
                const devices = [];
                items
                    .sort((a, b) => (a.fqdn > b.fqdn ? 1 : -1))
                    .map((device) => {
                    devices.push({
                        host: device.address,
                        port: device.service.port,
                        fqdn: device.fqdn.replace(/_esphomelib\._tcp./gi, '')
                    });
                });
                resolve(devices);
            })
                .catch((e) => {
                reject(e);
            });
        });
    });
}
exports.discovery = discovery;
exports.Status = {
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
};
//# sourceMappingURL=utils.js.map