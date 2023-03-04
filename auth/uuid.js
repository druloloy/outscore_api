const crypto = require('crypto');

module.exports = () => {
    const uuid = crypto.randomUUID();
    return uuid;
}