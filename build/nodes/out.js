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
const util_1 = require("util");
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
        self.on('input', (msg, send, done) => __awaiter(this, void 0, void 0, function* () {
            const entity = self.deviceNode.entities.find((e) => e.key == config.entity);
            const command = entity.type.toLowerCase() + 'CommandService';
            const regexpType = /^(BinarySensor|Sensor|TextSensor)$/gi;
            const regexpEntity = /^(Logs|BLE)$/gi;
            if (entity.type.match(regexpType) || config.entity.match(regexpEntity)) {
                done();
                return;
            }
            let data = msg.payload;
            data = typeof data.state !== 'undefined' && typeof data.state !== 'object' ? data.state : (0, util_1.inspect)(data);
            if (data && data.length > 32) {
                data = data.substr(0, 32) + '...';
            }
            setStatus({ fill: 'yellow', shape: 'dot', text: data }, 3000);
            try {
                yield self.deviceNode.client.connection[command](Object.assign({ key: config.entity }, msg.payload));
            }
            catch (e) {
                setStatus(utils_1.Status['error'], 3000);
                self.error(e.message);
            }
            done();
        }));
        const onStatus = (status) => {
            self.current_status = status;
            setStatus(utils_1.Status[self.current_status]);
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