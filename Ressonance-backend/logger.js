const fs = require('node:fs');
const path = require('node:path');
const winston = require('winston');

function createLogger(file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    return winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
        ),
        transports: [new winston.transports.File({ filename: file }), new winston.transports.Console()]
    });
}
module.exports = { createLogger };
