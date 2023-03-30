"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Client } = require('@2colors/esphome-native-api');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Package = require('../../package.json');
const utils_1 = require("../lib/utils");
module.exports = (RED) => {
    RED.nodes.registerType('esphome-device', function (config) {
        var _a, _b, _c, _d;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        self.config = config;
        RED.nodes.createNode(this, config);
        self.setMaxListeners(0);
        self.device = {};
        self.entities = [];
        self.current_status = 'disconnected';
        self.logger = parseInt((_a = self.config) === null || _a === void 0 ? void 0 : _a.loglevel);
        self.ble = Boolean((_b = self.config) === null || _b === void 0 ? void 0 : _b.ble);
        if (!((_c = self.config) === null || _c === void 0 ? void 0 : _c.host) || !((_d = self.config) === null || _d === void 0 ? void 0 : _d.port)) {
            return;
        }
        self.onStatus = function (string) {
            self.current_status = string;
            self.emit('onStatus', string);
        };
        self.onState = function (object) {
            self.emit('onState', object);
        };
        self.onBle = function (object) {
            self.emit('onBle', object);
        };
        let options = {
            host: self.config.host,
            port: self.config.port,
            password: self.credentials.password,
            clientInfo: Package.name + ' ' + Package.version,
            initializeDeviceInfo: true,
            initializeListEntities: true,
            initializeSubscribeStates: true,
            reconnect: true,
            reconnectInterval: 15 * 1000,
            pingInterval: 15 * 1000,
            initializeSubscribeBLEAdvertisements: self.ble
        };
        if (self.logger) {
            options = Object.assign(Object.assign({}, options), { initializeSubscribeLogs: {
                    level: self.config.loglevel,
                    dumpConfig: self.config.logdump
                } });
        }
        self.client = new Client(options);
        try {
            self.client.connect();
            self.client.connection.setMaxListeners(0);
        }
        catch (e) {
            self.error(e.message);
            return;
        }
        self.client.on('error', (e) => {
            if (e.message.includes('EHOSTUNREACH')) {
                /* empty */
            }
            else if (e.message.includes('Invalid password')) {
                /* empty */
            }
            else if (e.message.includes('ECONNRESET')) {
                /* empty */
            }
            else if (e.message.includes('TIMEOUT')) {
                /* empty */
            }
            else if (e.message.includes('write after end')) {
                /* empty */
            }
            else {
                // copy this error to issues ...
            }
            self.error(e.message);
            self.onStatus('error');
        });
        self.client.on('disconnected', () => {
            self.onStatus('disconnected');
        });
        self.client.on('connected', () => {
            // clear entities
            self.entities = [];
            // logs to entities
            if (self.logger) {
                self.entities.push({
                    key: 'logs',
                    type: 'Systems',
                    name: 'Logs',
                    config: {
                        deviceClass: utils_1.LogLevel[self.config.loglevel]
                    }
                });
            }
            // ble to entities
            if (self.ble) {
                self.entities.push({
                    key: 'ble',
                    type: 'Systems',
                    name: 'BLE'
                });
            }
            self.onStatus('connecting');
        });
        self.client.on('initialized', () => {
            self.onStatus('connected');
        });
        self.client.on('deviceInfo', (deviceInfo) => {
            self.device = deviceInfo;
        });
        self.client.on('newEntity', (entity) => {
            self.entities.push({
                key: entity.id,
                type: entity.type,
                name: entity.name,
                config: entity.config
            });
            entity.on('state', (state) => {
                self.onState(Object.assign({}, state));
            });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            entity.on('error', (e) => {
                /* empty */
            });
        });
        // logs
        self.client.on('logs', (payload) => {
            self.onState(Object.assign({ key: 'logs' }, payload));
        });
        // ble
        self.client.on('ble', (payload) => {
            self.onBle(Object.assign({ key: 'ble' }, payload));
        });
        self.on('close', () => {
            self.client.disconnect();
        });
    }, {
        credentials: {
            password: { type: 'password' }
        }
    });
};
//# sourceMappingURL=device.js.map