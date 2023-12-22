"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Client } = require('@2colors/esphome-native-api');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Package = require('../../package.json');
const utils_1 = require("../lib/utils");
module.exports = (RED) => {
    RED.nodes.registerType('esphome-device', function (config) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        self.config = config;
        RED.nodes.createNode(this, config);
        self.setMaxListeners(0);
        self.device = {};
        self.entities = [];
        self.current_status = 'disconnected';
        self.logger = parseInt(config === null || config === void 0 ? void 0 : config.loglevel);
        self.ble = Boolean(config === null || config === void 0 ? void 0 : config.ble);
        if (!(config === null || config === void 0 ? void 0 : config.host) || !(config === null || config === void 0 ? void 0 : config.port)) {
            return;
        }
        self.onStatus = function (string) {
            self.current_status = string;
            self.emit('onStatus', string);
            self.emit('onState', { key: 'status', state: string });
        };
        self.onState = function (object) {
            self.emit('onState', object);
        };
        self.onBle = function (object) {
            self.emit('onBle', object);
        };
        let options = {
            host: config.host,
            port: config.port,
            clientInfo: `${Package.name} ${Package.version}`,
            initializeDeviceInfo: true,
            initializeListEntities: true,
            initializeSubscribeStates: true,
            reconnect: true,
            reconnectInterval: ((config === null || config === void 0 ? void 0 : config.reconnect) || 15) * 1000,
            pingInterval: 15 * 1000,
            initializeSubscribeBLEAdvertisements: self.ble
        };
        if (self.credentials.encryptionkey) {
            options = Object.assign(Object.assign({}, options), { encryptionKey: self.credentials.encryptionkey });
        }
        else {
            options = Object.assign(Object.assign({}, options), { password: self.credentials.password });
        }
        if (self.logger) {
            options = Object.assign(Object.assign({}, options), { initializeSubscribeLogs: {
                    level: config.loglevel,
                    dumpConfig: config.logdump
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
                        deviceClass: utils_1.LogLevel[config.loglevel]
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
            // status to entities
            self.entities.push({
                key: 'status',
                type: 'Systems',
                name: 'Status'
            });
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
            encryptionkey: { type: 'password' },
            password: { type: 'password' }
        }
    });
};
//# sourceMappingURL=device.js.map