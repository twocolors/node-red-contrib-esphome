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
        // Rate limiting for state updates
        let lastStateTime = 0;
        const minStateInterval = 100; // minimum 100ms between state updates
        self.onState = function (object) {
            const now = Date.now();
            if (now - lastStateTime >= minStateInterval) {
                lastStateTime = now;
                self.emit('onState', object);
            }
        };
        self.onBle = function (object) {
            self.emit('onBle', object);
        };
        // ESPHome keepalive configuration - use default if empty, undefined, or invalid
        const pingInterval = ((config === null || config === void 0 ? void 0 : config.pingInterval) && config.pingInterval > 0) ? config.pingInterval : 20; // seconds
        const keepalive_ratio = 4.5;
        // Use manual reconnect value if set and not empty, otherwise auto-calculate
        const hasManualReconnect = (config === null || config === void 0 ? void 0 : config.reconnect) !== undefined && (config === null || config === void 0 ? void 0 : config.reconnect) !== null && (config === null || config === void 0 ? void 0 : config.reconnect) !== '' && (config === null || config === void 0 ? void 0 : config.reconnect) > 0;
        const reconnectInterval = hasManualReconnect ? config.reconnect : pingInterval * keepalive_ratio;
        let options = {
            host: config.host,
            port: config.port,
            clientInfo: `${Package.name} ${Package.version}`,
            initializeDeviceInfo: true,
            initializeListEntities: true,
            initializeSubscribeStates: true,
            reconnect: true,
            reconnectInterval: reconnectInterval * 1000,
            pingInterval: pingInterval * 1000,
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
        // Validate encryption key format if provided
        if (self.credentials.encryptionkey) {
            const key = self.credentials.encryptionkey;
            if (typeof key !== 'string' || key.length === 0) {
                self.error('Invalid encryption key format');
                self.onStatus('error');
                return;
            }
        }
        let client;
        try {
            self.client = new Client(options);
            client = self.client;
        }
        catch (e) {
            self.error(`Failed to create ESPHome client: ${e.message}`);
            self.onStatus('error');
            return;
        }
        try {
            self.client.connect();
            if (self.client.connection && self.client.connection.setMaxListeners) {
                self.client.connection.setMaxListeners(0);
            }
        }
        catch (e) {
            self.error(`Connection failed: ${e.message}`);
            self.onStatus('error');
            return;
        }
        self.client.on('error', (e) => {
            const errorMessage = e.message || 'Unknown error';
            // Handle specific authentication errors
            if (errorMessage.includes('auth') || errorMessage.includes('encryption') ||
                errorMessage.includes('password') || errorMessage.includes('key') ||
                errorMessage.includes('Invalid encryption key') || errorMessage.includes('Authentication failed')) {
                self.error(`Authentication failed - check encryption key/password: ${errorMessage}`);
                self.onStatus('error');
                // Safely disconnect on authentication errors to prevent crashes
                try {
                    if (self.client && typeof self.client.disconnect === 'function') {
                        self.client.disconnect();
                    }
                }
                catch (disconnectError) {
                    // Ignore disconnect errors
                }
                return;
            }
            if (errorMessage.includes('connect') || errorMessage.includes('timeout')) {
                self.error(`Connection failed: ${errorMessage}`);
            }
            else {
                // Avoid spam logging the same error
                if (self.lastError !== errorMessage) {
                    self.error(`ESPHome error: ${errorMessage}`);
                    self.lastError = errorMessage;
                }
            }
            self.onStatus('error');
        });
        self.client.on('disconnected', () => {
            self.lastError = null; // Reset error state on disconnect
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
            try {
                if (self.client && typeof self.client.disconnect === 'function') {
                    self.client.disconnect();
                }
            }
            catch (e) {
                // Ignore disconnect errors during close to prevent crashes
            }
        });
    }, {
        credentials: {
            encryptionkey: { type: 'password' },
            password: { type: 'password' }
        }
    });
};
//# sourceMappingURL=device.js.map