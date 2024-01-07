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
const utils_1 = require("../lib/utils");
module.exports = (RED) => {
    RED.nodes.registerType('esphome-out', function (config) {
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
        const clearStatus = (timeout = 0) => {
            const current_status = self.deviceNode.current_status;
            setTimeout(() => {
                if (current_status) {
                    self.status(utils_1.Status[current_status]);
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
        const capitalize = (s) => (s[0].toLowerCase() + s.slice(1));
        self.on('input', (msg, send, done) => __awaiter(this, void 0, void 0, function* () {
            const entity = self.deviceNode.entities.find((e) => e.key == config.entity);
            if (typeof entity == 'undefined') {
                setStatus(utils_1.Status['error'], 3000);
                self.error(`Entity (${config.entity}) not found on device`);
                done();
                return;
            }
            const regexpType = /^(BinarySensor|Sensor|TextSensor)$/gi;
            const regexpEntity = /^(Logs|BLE|Status)$/gi;
            if (entity.type.match(regexpType) || config.entity.match(regexpEntity)) {
                done();
                return;
            }
            const payload = msg.payload;
            let text;
            if (typeof payload.state !== 'undefined' && typeof payload.state !== 'object') {
                text = String(payload.state);
            }
            else {
                if (typeof payload !== 'undefined' && typeof payload === 'object') {
                    text = String(`${Object.keys(payload)[0]}: ${Object.values(payload)[0]}`);
                }
                else {
                    text = String(payload);
                }
            }
            if (text && text.length > 32) {
                text = `${text.substring(0, 32)}...`;
            }
            try {
                const command = capitalize(entity.type + 'CommandService');
                yield self.deviceNode.client.connection[command](Object.assign({ key: config.entity }, payload));
                if (text)
                    setStatus({ fill: 'yellow', shape: 'dot', text: text });
            }
            catch (e) {
                setStatus(utils_1.Status['error'], 3000);
                self.error(e.message);
            }
            done();
        }));
        const onStatus = (status) => {
            setStatus(utils_1.Status[status]);
        };
        self.onStatus = (status) => onStatus(status);
        self.deviceNode.on('onStatus', self.onStatus);
        self.on('close', (_, done) => {
            self.deviceNode.removeListener('onStatus', self.onStatus);
            done();
        });
    });
};
//# sourceMappingURL=out.js.map