"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Client } = require('esphome-native-api');
module.exports = (RED) => {
    RED.nodes.registerType('esphome-device', function (config) {
        var _a;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        self.config = config;
        RED.nodes.createNode(this, config);
        self.device = {};
        self.entities = [];
        self.current_status = 'disconnected';
        if (!(config === null || config === void 0 ? void 0 : config.host) || !(config === null || config === void 0 ? void 0 : config.port) || !((_a = self.credentials) === null || _a === void 0 ? void 0 : _a.password)) {
            return;
        }
        self.onStatus = function (string) {
            self.current_status = string;
            self.emit('onStatus', string);
        };
        self.onState = function (object) {
            self.emit('onState', object);
        };
        self.client = new Client({
            host: config.host,
            port: config.port,
            password: self.credentials.password,
            clientInfo: 'node-red',
            initializeDeviceInfo: true,
            initializeListEntities: true,
            initializeSubscribeStates: false,
            reconnect: true,
            reconnectInterval: 15 * 1000,
            pingInterval: 5 * 1000
        });
        try {
            self.client.connect();
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
                self.error(e.message);
            }
            else if (e.message.includes('ECONNRESET')) {
                /* empty */
            }
            else if (e.message.includes('timeout')) {
                /* empty */
            }
            else if (e.message.includes('write after end')) {
                /* empty */
            }
            else {
                // copy this error to issues ...
            }
            self.onStatus('error');
        });
        self.client.on('disconnected', () => {
            self.onStatus('disconnected');
        });
        self.client.on('connected', () => {
            // clear entities
            self.entities = [];
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
            entity.connection.subscribeStatesService();
            entity.on('state', (state) => {
                self.onState(Object.assign({}, state));
            });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            entity.on('error', (e) => {
                /* empty */
            });
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