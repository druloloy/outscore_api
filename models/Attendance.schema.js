const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    daysAbsent: {
        type: String,
    },
    totalDays: {
        type: String,
    },
},{
    _id: false
});

module.exports = AttendanceSchema;