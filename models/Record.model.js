const mongoose = require('mongoose');
const GradeSchema = require('./Grading.schema');

const RecordSchema = new mongoose.Schema({
    lrn: {
        type: String,
        required: true,
    },
    level: {
        type: String,
        required: true,
    },
    section: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    teacherInCharge: {
        type: String,
        required: true,
    },
    grades: {
        type: [GradeSchema],
        required: true,
    }
});

RecordSchema.methods.addGrade = function(grade) {
    const record = this;
    // override the grade if it already exists
    const existingGrade = Array.from(record.grades).find(g => g.period === grade.period);
    if (!existingGrade) {
        record.grades.push(grade);
        return record;
    }

    existingGrade.score = grade.score;
    existingGrade.attendance = grade.attendance;
    
    return record;
};

module.exports = mongoose.model('Record', RecordSchema);