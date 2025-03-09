"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    constructor(service) {
        this.service = service;
    }
    info(action, data) {
        this.log('INFO', action, data);
    }
    error(action, data) {
        this.log('ERROR', action, data);
    }
    warn(action, data) {
        this.log('WARN', action, data);
    }
    log(level, action, data) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            service: this.service,
            action,
            ...data && { data },
        };
        console.log(JSON.stringify(entry));
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map