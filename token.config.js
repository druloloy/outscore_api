module.exports = {
    ACCESS: {
        SECRET: process.env.ACCESS_TOKEN_SECRET,
        EXPIRES_IN: '7h',
        MAX_AGE: ((60 * 15) * 1000), // 15m
    },
    REFRESH: {
        SECRET: process.env.REFRESH_TOKEN_SECRET,
        EXPIRES_IN: '7d',
        MAX_AGE: ((60 * 60) * 1000) * 24 * 7, // 7d
    }
}