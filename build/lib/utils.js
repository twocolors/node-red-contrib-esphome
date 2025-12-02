"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = exports.Status = void 0;
exports.roundToX = roundToX;
exports.Status = {
    error: {
        fill: 'red',
        shape: 'dot',
        text: 'error'
    },
    disconnected: {
        fill: 'red',
        shape: 'ring',
        text: 'disconnected'
    },
    connecting: {
        fill: 'yellow',
        shape: 'ring',
        text: 'connecting'
    },
    connected: {
        fill: 'green',
        shape: 'dot',
        text: 'connected'
    }
};
exports.LogLevel = {
    0: 'NONE',
    1: 'ERROR',
    2: 'WARN',
    3: 'INFO',
    4: 'CONFIG',
    5: 'DEBUG',
    6: 'VERBOSE',
    7: 'VERY_VERBOSE'
};
function roundToX(num, X) {
    return Number(Math.round(Number(`${num}e+${X}`)) + `e-${X}`);
}
//# sourceMappingURL=utils.js.map