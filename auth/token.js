const tokenConfig = require('../token.config');
const {sign, verify, decode} = require('jsonwebtoken')

exports.createAccessToken = (payload) => {
    return sign(payload, tokenConfig.ACCESS.SECRET, {expiresIn: tokenConfig.ACCESS.EXPIRES_IN})
}

exports.createRefreshToken = (payload) => {
    return sign(payload, tokenConfig.REFRESH.SECRET, {expiresIn: tokenConfig.REFRESH.EXPIRES_IN})
}

exports.verifyAccessToken = (token) => {
    return verify(token, tokenConfig.ACCESS.SECRET)
}

exports.verifyRefreshToken = (token) => {
    return verify(token, tokenConfig.REFRESH.SECRET)
}

// students only
exports.createStudentAccessToken = (token) => {
    // student access token is derived from the refresh token

    // decode the refresh token
    const decoded = decode(token, {complete: true});
    // get payload
    const payload = {
        id: decoded.id,
        lrn: decoded.lrn,
        name: decoded.name
    }
    // create access token
    return sign(payload, tokenConfig.ACCESS.SECRET, {expiresIn: tokenConfig.ACCESS.EXPIRES_IN})
}