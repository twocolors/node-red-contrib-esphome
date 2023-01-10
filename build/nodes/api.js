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
    const NODE_PATH = '/esphome/';
    RED.httpAdmin.post(NODE_PATH + 'discovery', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        (0, utils_1.discovery)()
            .then((devices) => {
            res.json(devices);
        })
            .catch((e) => {
            res.json(e);
        });
    }));
    RED.httpAdmin.post(NODE_PATH + 'entities', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const deviceNode = RED.nodes.getNode(req.body.deviceNode);
        if (deviceNode) {
            res.json(deviceNode.entities);
        }
        else {
            res.json([]);
        }
    }));
};
//# sourceMappingURL=api.js.map