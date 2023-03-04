const mongoose = require('mongoose');
const AttendanceSchema = require('./Attendance.schema');

const GradeSchema = new mongoose.Schema({
    period: {
        type: String,
        required: true,
        unique: false
    },
    score: {
        type: String,
        required: false,
        default: 0,
    },
    attendance: {
        type: AttendanceSchema,
        required: false,
    }
});

module.exports = GradeSchema;