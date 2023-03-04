const {sign, verify, decode} = require('jsonwebtoken')

exports.createAccessToken = (payload) => {
    return sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'})
}

exports.createRefreshToken = (payload) => {
    return sign(payload, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'})
}

exports.verifyAccessToken = (token) => {
    return verify(token, process.env.ACCESS_TOKEN_SECRET)
}

exports.verifyRefreshToken = (token) => {
    return verify(token, process.env.REFRESH_TOKEN_SECRET)
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
    return sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'})
}