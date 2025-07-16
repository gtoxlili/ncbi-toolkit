"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NCBIError = void 0;
class NCBIError extends Error {
    constructor(message, statusCode, response) {
        super(message);
        this.statusCode = statusCode;
        this.response = response;
        this.name = "NCBIError";
    }
}
exports.NCBIError = NCBIError;
//# sourceMappingURL=NCBIError.js.map