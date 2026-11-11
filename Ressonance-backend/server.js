// Ponto de entrada. Rotas, validação, persistência e configuração em módulos separados.
const { loadConfig } = require('./config');
const { createPool } = require('./db');
const { createRepository } = require('./repository');
const { createLogger } = require('./logger');
const { createApp } = require('./app');

async function start() {
    const config = loadConfig(); // encerra a aplicação se JWT_SECRET estiver ausente
    const logger = createLogger(config.logFile);
    const pool = createPool(config.database);
    await pool.query('SELECT 1'); // falha visível se MySQL não estiver configurado
    const app = createApp({ repo: createRepository(pool), jwtSecret: config.jwtSecret, logger, nodeEnv: config.nodeEnv, corsOrigins: config.corsOrigins });
    const server = app.listen(config.port, () => logger.info(`Servidor iniciado na porta ${config.port}.`));
    const shutdown = () => server.close(() => pool.end().then(() => process.exit(0)));
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    return server;
}
if (require.main === module) {
    start().catch(err => { console.error(`Falha ao iniciar: ${err.message}`); process.exitCode = 1; });
}
module.exports = { start };
