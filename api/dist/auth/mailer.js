"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
function sanitizeHeader(value) {
    return value.replace(/[\r\n]+/g, ' ').trim();
}
async function sendMail(payload) {
    const phpPath = process.env.PHP_BINARY || 'php';
    const scriptPath = path_1.default.resolve(__dirname, '../../scripts/send_smtp_mail.php');
    if (!(0, fs_1.existsSync)(scriptPath)) {
        throw new Error(`No se encontró el helper SMTP en ${scriptPath}`);
    }
    await new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(phpPath, [scriptPath]);
        let stderr = '';
        child.on('error', reject);
        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
                return;
            }
            reject(new Error(stderr.trim() || `php mailer terminó con código ${code}`));
        });
        child.stdin.write(JSON.stringify({
            to: sanitizeHeader(payload.to),
            subject: sanitizeHeader(payload.subject),
            text: payload.text
        }));
        child.stdin.end();
    });
}
//# sourceMappingURL=mailer.js.map