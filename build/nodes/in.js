"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../lib/utils");
const util_1 = require("util");
module.exports = (RED) => {
    RED.nodes.registerType('esphome-in', function (config) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        self.config = config;
        RED.nodes.createNode(this, config);
        try {
            self.deviceNode = RED.nodes.getNode(config.device);
        }
        catch (_) {
            /* empty */
        }
        if (!self.deviceNode || !config.entity) {
            return;
        }
        self.current_status = self.deviceNode.current_status;
        const clearStatus = (timeout = 0) => {
            setTimeout(() => {
                if (self.current_status) {
                    self.status(utils_1.Status[self.current_status]);
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
            const payload = Object.assign({}, state);
            if (payload.key != config.entity) {
                return;
            }
            delete payload.key;
            let text = typeof payload.state !== 'undefined' && typeof payload.state !== 'object' ? payload.state : (0, util_1.inspect)(payload);
            if (text && text.length > 32) {
                text = text.substr(0, 32) + '...';
            }
            setStatus({ fill: 'yellow', shape: 'dot', text: text }, 3000);
            const entity = self.deviceNode.entities.find((e) => e.key == config.entity);
            self.send({
                payload: payload,
                device: self.deviceNode.device,
                config: entity === null || entity === void 0 ? void 0 : entity.config,
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
                config: entity === null || entity === void 0 ? void 0 : entity.config,
                entity: entity
            });
        };
        const onStatus = (status) => {
            self.current_status = status;
            setStatus(utils_1.Status[self.current_status]);
        };
        self.onState = (state) => onState(state);
        self.deviceNode.on('onState', self.onState);
        self.onBle = (data) => onBle(data);
        self.deviceNode.on('onBle', self.onBle);
        self.onStatus = (status) => onStatus(status);
        self.deviceNode.on('onStatus', self.onStatus);
        self.on('close', (_, done) => {
            self.deviceNode.removeListener('onState', self.onState);
            self.deviceNode.removeListener('onBle', self.onBle);
            self.deviceNode.removeListener('onStatus', self.onStatus);
            done();
        });
    });
};
//# sourceMappingURL=in.js.map