const Dictionary = require('../utils/dictionary/phraser');
const crypto = require('crypto');
const Exception = require('../utils/Exception');

module.exports = () => {
    try {
        const instance = Dictionary.getInstance();
        const randWord = instance.pickWord().trim();
        const randHex = crypto.randomBytes(8).toString('hex');
    
        return `${randWord}-${randHex}`;
    }
    catch (err) {
        throw new Exception(`Error generating OTP. ${err}`, 500);
    }
}