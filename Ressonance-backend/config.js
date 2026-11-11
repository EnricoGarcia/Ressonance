const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

function loadConfig(env = process.env) {
    if (!env.JWT_SECRET || Buffer.byteLength(env.JWT_SECRET, 'utf8') < 32) {
        throw new Error('JWT_SECRET deve ser definido no .env com pelo menos 32 bytes aleatórios.');
    }
    return {
        jwtSecret: env.JWT_SECRET,
        nodeEnv: env.NODE_ENV || 'development',
        port: Number(env.PORT || 3000),
        logFile: env.LOG_FILE || path.join(__dirname, 'logs', 'app.log'),
        corsOrigins: (env.CORS_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500').split(',').map(s => s.trim()).filter(Boolean),
        database: {
            host: env.DB_HOST || '127.0.0.1',
            user: env.DB_USER || 'root',
            password: env.DB_PASSWORD || '',
            database: env.DB_NAME || 'ressonance_data',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        }
    };
}
module.exports = { loadConfig };
