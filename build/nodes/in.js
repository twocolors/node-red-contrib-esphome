"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../lib/utils");
module.exports = (RED) => {
    RED.nodes.registerType('esphome-in', function (config) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        self.config = config;
        RED.nodes.createNode(this, config);
        // system
        self.text_status = undefined;
        self.lastStateTime = {};
        self.stateThrottleInterval = config.stateThrottleInterval || 100; // minimum ms between same entity states
        try {
            self.deviceNode = RED.nodes.getNode(config.device);
        }
        catch (e) {
            self.error(`Failed to get device node: ${e.message}`);
            self.status({ fill: 'red', shape: 'ring', text: 'device error' });
            return;
        }
        if (!self.deviceNode) {
            self.error('Device node not found or not configured');
            self.status({ fill: 'red', shape: 'ring', text: 'no device' });
            return;
        }
        if (!config.entity) {
            self.error('Entity not configured');
            self.status({ fill: 'red', shape: 'ring', text: 'no entity' });
            return;
        }
        const clearStatus = (timeout = 0) => {
            const current_status = self.deviceNode.current_status;
            setTimeout(() => {
                if (current_status) {
                    if (current_status != 'connected' || self.text_status == 'connected') {
                        self.status(utils_1.Status[current_status]);
                    }
                }
                else {
                    self.status({});
                }
            }, timeout);
        };
        const setStatus = (status, timeout = 0) => {
            self.status(status);
            if (timeout) {
                clearStatus(timeout);
            }
        };
        const onState = (state) => {
            const now = Date.now();
            const entityKey = state.key;
            // Throttle state updates per entity
            if (self.lastStateTime[entityKey] && (now - self.lastStateTime[entityKey]) < self.stateThrottleInterval) {
                return; // Skip this update
            }
            self.lastStateTime[entityKey] = now;
            const payload = Object.assign({}, state);
            const topic = self.config.topic === undefined ? '' : self.config.topic;
            if (payload.key != config.entity) {
                return;
            }
            delete payload.key;
            let text = typeof payload.state !== 'undefined' && typeof payload.state !== 'object' ? String(payload.state) : 'json';
            if (text && text.length > 32) {
                text = `${text.substring(0, 32)}...`;
            }
            self.text_status = text;
            setStatus({ fill: 'yellow', shape: 'dot', text: text }, 3000);
            const entity = self.deviceNode.entities.find((e) => e.key == config.entity);
            self.send({
                topic: topic,
                payload: payload,
                device: self.deviceNode.device,
                entity: entity
            });
        };
        const onBle = (data) => {
            let address = config.bleaddress;
            const payload = Object.assign({}, data);
            address = address.toLowerCase().replace(/[^a-f0-9]/g, '');
            payload.address = payload.address.toString(16);
            if (payload.address != address) {
                return;
            }
            delete payload.key;
            setStatus({ fill: 'blue', shape: 'dot', text: 'ble' }, 3000);
            const entity = self.deviceNode.entities.find((e) => e.key == config.entity);
            self.send({
                payload: payload,
                device: self.deviceNode.device,
                entity: entity
            });
        };
        const onStatus = (status) => {
            setStatus(utils_1.Status[status]);
        };
        self.onState = (state) => {
            try {
                onState(state);
            }
            catch (e) {
                self.error(`State processing error: ${e.message}`);
            }
        };
        self.onBle = (data) => {
            try {
                onBle(data);
            }
            catch (e) {
                self.error(`BLE processing error: ${e.message}`);
            }
        };
        self.onStatus = (status) => {
            try {
                onStatus(status);
            }
            catch (e) {
                self.error(`Status processing error: ${e.message}`);
            }
        };
        // Safely add event listeners
        try {
            if (self.deviceNode && typeof self.deviceNode.on === 'function') {
                self.deviceNode.on('onState', self.onState);
                self.deviceNode.on('onBle', self.onBle);
                self.deviceNode.on('onStatus', self.onStatus);
            }
        }
        catch (e) {
            self.error(`Failed to attach event listeners: ${e.message}`);
        }
        self.on('close', (_, done) => {
            try {
                if (self.deviceNode && typeof self.deviceNode.removeListener === 'function') {
                    self.deviceNode.removeListener('onState', self.onState);
                    self.deviceNode.removeListener('onBle', self.onBle);
                    self.deviceNode.removeListener('onStatus', self.onStatus);
                }
            }
            catch (e) {
                // Ignore cleanup errors to prevent crashes during shutdown
            }
            done();
        });
    });
};
//# sourceMappingURL=in.js.map