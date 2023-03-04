String.prototype.reverse = function() {
    return this.split('').reverse().join('');
}

exports.getIdentifier = (password) => {
    // get the last 6 characters of the password
    return password
        .reverse()
        .substring(0, 6)
        .reverse();
}

exports.createPlaceholder = () => {
    const placeholder = require('crypto').randomBytes(8).toString('base64url');
    return placeholder;
}