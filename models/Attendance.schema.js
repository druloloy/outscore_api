const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    daysPresent: {
        type: String,
    },
    excusedAbsences: {
        type: String,
    },
    unexcusedAbsences: {
        type: String,
    }
},{
    _id: false,
    timestamps: true
});

module.exports = AttendanceSchema;