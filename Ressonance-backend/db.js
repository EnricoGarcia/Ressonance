const mysql = require('mysql2/promise');
function createPool(config) {
    return mysql.createPool(config);
}
module.exports = { createPool };
