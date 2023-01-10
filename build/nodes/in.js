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
            self.deviceNode = RED.nodes.getNode(self.config.device);
        }
        catch (_) {
            /* empty */
        }
        if (!self.deviceNode || !self.config.entity) {
            return;
        }
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
            if (state.key != config.entity) {
                return;
            }
            delete state.key;
            let data = typeof state.state !== 'undefined' && typeof state.state !== 'object' ? state.state : (0, util_1.inspect)(state);
            if (data && data.length > 32) {
                data = data.substr(0, 32) + '...';
            }
            setStatus({ fill: 'yellow', shape: 'dot', text: data }, 3000);
            const entity = self.deviceNode.entities.find((e) => e.key == config.entity);
            self.send({
                payload: state,
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
        self.onStatus = (status) => onStatus(status);
        self.deviceNode.on('onStatus', self.onStatus);
        self.on('close', (_, done) => {
            self.deviceNode.removeListener('onState', self.onState);
            self.deviceNode.removeListener('onStatus', self.onStatus);
            done();
        });
    });
};
//# sourceMappingURL=in.js.map