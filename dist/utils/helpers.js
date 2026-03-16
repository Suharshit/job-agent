"use strict";
// src/utils/helpers.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
exports.logError = logError;
exports.sleep = sleep;
exports.randomDelay = randomDelay;
exports.sanitizeText = sanitizeText;
function log(module, message) {
    const time = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${time}] [${module}] ${message}`);
}
function logError(module, message, error) {
    const time = new Date().toISOString().split('T')[1].split('.')[0];
    console.error(`[${time}] [${module}] ❌ ${message}`, error ?? '');
}
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function randomDelay(minMs, maxMs) {
    const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return sleep(ms);
}
function sanitizeText(text) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/[\r\n]+/g, '\n')
        .trim();
}
