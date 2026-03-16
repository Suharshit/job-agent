"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const helpers_1 = require("./utils/helpers");
const index_1 = require("./index");
async function test() {
    (0, helpers_1.log)('test', '--- Phase 5 Full Pipeline Test ---');
    const result = await (0, index_1.runPipeline)('software engineer intern India');
    (0, helpers_1.log)('test', `Success: ${result.success}`);
    (0, helpers_1.log)('test', `Jobs processed: ${result.jobs_processed}`);
    if (result.errors.length > 0) {
        (0, helpers_1.log)('test', `Errors: ${result.errors.join(', ')}`);
    }
    (0, helpers_1.log)('test', '--- Done ---');
}
test().catch(console.error);
