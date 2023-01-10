"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../lib/utils");
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
            //setStatus({fill: 'yellow', shape: 'dot', text: state.state}, 3000);
            self.send({
                payload: state,
                payload_raw: state,
                device: self.deviceNode.device
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