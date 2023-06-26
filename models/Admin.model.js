const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { createAccessToken, createRefreshToken } = require('../auth/token');
const Exception = require('../utils/Exception');
const AdminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    refreshTokens: [Object]
});

AdminSchema.pre('save', function(next) {
    const admin = this;
    if (!admin.isModified('password')) return next();
    bcrypt.genSalt(10, (err, salt) => {
        if (err) return next(err);
        bcrypt.hash(admin.password, salt, (err, hash) => {
            if (err) return next(err);
            admin.password = hash;
            next();
        });
    });
});

AdminSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

AdminSchema.methods.generateRefreshToken = async function(req) {
    try {
        const admin = this;
        const payload = {
            id: admin._id,
            username: admin.username
        }
        const refreshToken = createRefreshToken(payload);
        const ip = req.ip;
        const userAgent = req.useragent; 
        const os = userAgent.os; 
        admin.refreshTokens.push({
            id: new mongoose.Types.ObjectId(),
            ip,
            os,
            refreshToken,
            createdAt: Date.now()
        });
        await admin.save();
        return refreshToken;
    } catch (error) {
        console.log(error);
        throw new Exception('Error generating token.', 500);
    }
}

AdminSchema.methods.generateAccessToken = function() {
    try {
        const admin = this;
        const payload = {
            id: admin._id,
            username: admin.username
        }
        const accessToken = createAccessToken(payload);
        return accessToken;
    } catch (error) {
        throw new Exception('Error generating token.', 500);
    }
}

module.exports = mongoose.model('Admin', AdminSchema);