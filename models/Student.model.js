const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const generateOtp = require('../auth/otp');
const Exception = require('../utils/Exception');
const { createAccessToken, createRefreshToken } = require('../auth/token');
const StudentSession = require('./StudentSession.model');
const uuid = require('../auth/uuid');

const StudentSchema = new mongoose.Schema({
    lrn: {
        type: String,
        required: true,
        unique: true,
        match: [/^[0-9]{12}$/, 'LRN must be 12 digits long.']
    },
    firstName: {
        type: String,
        required: true,
    },
    middleName: {
        type: String,
        required: false,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    identifier: {
        type: String,
        required: true,
        unique: true
    }
});

StudentSchema.pre('save', function(next) {
    const student = this;
    if (!student.isModified('password')) return next();

    bcrypt.genSalt(10, (err, salt) => {
        if (err) return next(err);
        bcrypt.hash(student.password, salt, (err, hash) => {
            if (err) return next(err);
            student.password = hash;
            next();
        });
    });
});

StudentSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

StudentSchema.methods.generatePassword = function() {
    const student = this;
    const otp = generateOtp();
    student.password = otp;
    return otp;
}

StudentSchema.methods.generateRefreshToken = async function() {
    try {
        const student = this;
        const payload = {
            id: uuid()
        }

        const refreshToken = createRefreshToken(payload);
        const session = new StudentSession({
            _id: payload.id,
            studentId: student._id,
            session: refreshToken
        });
        await session.save();
        return refreshToken;
    } catch (error) {
        console.log(error)
        throw new Exception('Error generating token.', 500);
    }
}

StudentSchema.methods.generateAccessToken = async function() {
    try {
        const student = this;
        const payload = {
            id: student._id,
            name: `${student.firstName} ${student.lastName}`
        }
        const accessToken = createAccessToken(payload);
        return accessToken;
    } catch (error) {
        throw new Exception('Error generating token.', 500);
    }
}

module.exports = mongoose.model('Student', StudentSchema);