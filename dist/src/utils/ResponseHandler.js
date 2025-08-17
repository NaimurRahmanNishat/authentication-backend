"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
const successResponse = (res, statusCode, message, data = {}) => {
    res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};
exports.successResponse = successResponse;
const errorResponse = (res, statusCode, message, error = null) => {
    const errMsg = typeof error === "string" ? error : error ? error.message : null;
    res.status(statusCode).json({
        success: false,
        message,
        error: errMsg,
    });
};
exports.errorResponse = errorResponse;
exports.default = { successResponse: exports.successResponse, errorResponse: exports.errorResponse };
