const Admin = require('../models/Admin.model');
const SheetParser = require('../utils/SheetParser');
const Exception = require('../utils/Exception');
const cookieConfig = require('../cookie.config');
const Record = require('../models/Record.model');
const Subject = require('../models/Subject.model');
const Student = require('../models/Student.model');

const defaultSY = require('../utils/defaultSY');

const panda = require('../utils/encryption/Panda');
const tokenConfig = require('../token.config');
const StudentSession = require('../models/StudentSession.model');
const {
    getIdentifier
} = require('../utils/getIdentifier');
const {
    sendPasswordMail
} = require('../mail/mailer');

cookieConfig.maxAge = 1000 * 60 * 15; // 15 minutes


exports.signup = async (req, res, next) => {
    try {
        const {
            username,
            password
        } = req.body;
        const admin = new Admin({
            username,
            password
        });
        await admin.save();
        res.status(201).json({
            message: 'Admin created successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const {
            username,
            password
        } = req.body;

        const admin = await Admin.findOne({
            username
        });
        if (!admin) return next(new Exception("Invalid username/password.", 400));

        admin.comparePassword(password, async (err, isMatch) => {
            if (err) return next(new Exception("Invalid username/password.", 400));
            if (!isMatch) return next(new Exception("Invalid username/password.", 400));

            const refresh = await admin.generateRefreshToken(req);

            res.status(200).json({
                message: 'Login successful',
                token: refresh
            });
        });
    } catch (error) {
        next(error);
    }
};

exports.logout = async (req, res, next) => {
    try {
        const admin = req.user;
        const {
            refreshToken
        } = req.signedCookies;

        console.log(admin, refreshToken)

        admin.refreshTokens = admin.refreshTokens.filter(token => token !== refreshToken);
        await admin.save();

        res.clearCookie('refresh');
        res.clearCookie('access');
        res.status(200).json({
            message: 'Logout successful'
        });
    } catch (error) {
        next(error);
    }
};

exports.bulkCreateStudentsAccount = async (req, res, next) => {
    try {

        const {
            file
        } = req;

        const parser = SheetParser.createParser(file.mimetype).loadFileBuffer(file.buffer);
        const data = await parser.parse();

        const students = [];
        for (let i = 0; i < data.length; i++) {
            const student = data[i];
            const {
                lrn,
                firstName,
                lastName,
                middleName,
                email
            } = student;
            const studentExists = await Student.findOne({
                lrn
            });
            if (studentExists) continue;
            const newStudent = new Student({
                lrn,
                firstName,
                lastName,
                middleName,
                email,
            });

            const password = newStudent.generatePassword();
            newStudent.identifier = getIdentifier(password);
            await newStudent.save();

            // Send password to email
            const subject = 'Outscore | Your New Password';
            const d = {
                firstName: newStudent.firstName.toUpperCase(),
                lastName: newStudent.lastName.toUpperCase(),
                password
            }

            await sendPasswordMail(newStudent.email, subject, d)
                .catch(async (err) => {
                    await newStudent.remove();
                    next(new Exception(err, 500));
                });

            students.push(newStudent);
        }


        // students only show lrn, firstName, lastName, middleName
        students.forEach(student => {
            student.password = undefined;
            student.identifier = undefined;
            student.email = undefined;
        });
        
        res.status(200).json({
            content: students,
            message: 'Students created successfully.'
        });

    } catch (error) {
        next(error)
    }
};

exports.updateStudentAccount = async (req, res, next) => {
    try {
        const {
            lrn,
            firstName,
            lastName,
            middleName,
            email,
            isActive
        } = req.body;

        const student = await Student.findOne({
            lrn
        });
        if (!student) throw new Exception('Student does not exist.', 400);

        student.firstName = firstName;
        student.lastName = lastName;
        student.middleName = middleName;
        student.email = email;
        student.isActive = isActive;
        await student.save();

        res.status(200).json({
            content: student,
            message: 'Student updated successfully.'
        });

    } catch (error) {
        next(error);
    }
};

exports.uploadGrades = async (req, res, next) => {
    try {
        const {
            file
        } = req;
        const parser = SheetParser.createParser(file.mimetype).loadFileBuffer(file.buffer);
        const {
            studentGradeReport: studentReport,
            totalDays,
            daysAbsent
        } = await parser.parse(true);

        const subject = await Subject.findOne({
            name: studentReport.subject.toUpperCase()
        });
        if (!subject) {
            return next(new Exception('Subject does not exist.', 400));
        }

        const {
            lrn,
            subject: subjectName
        } = studentReport;

        if (!lrn.match(/^\d{12}$/))
            return res.status(400).json({
                message: 'LRN must be 12 digits long'
            });

        const recordData = {
            lrn,
            level: studentReport.level,
            section: studentReport.section,
            subject: subjectName.toUpperCase(),
            teacherInCharge: studentReport.teacherIncharge,
            sy: studentReport.schoolYear,
        };
        const grades = {
            period: studentReport.gradingPeriod,
            score: studentReport.grade,
            attendance: {
                totalDays: JSON.stringify(totalDays),
                daysAbsent: JSON.stringify(daysAbsent)
            },
        };

        let content;
        let record = await Record.findOne(await panda.encryptObject({
            lrn,
            subject: subjectName.toUpperCase(),
            sy: studentReport.schoolYear,
        }));
        if (record) {
            record.addGrade(await panda.encryptObject(grades));
            await record.save();
            content = record;
        } else {
            record = new Record(await panda.encryptObject(recordData));
            record.addGrade(await panda.encryptObject(grades));
            await record.save();
            content = record;
        }

        return res.status(200).json({
            content,
            message: 'Grades uploaded successfully'
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

exports.bulkUploadGrades = async (req, res, next) => {
    try {
        const { files } = req; 

        const content = [];

        const failed = [];

        for (const f of files) {
            const parser = SheetParser
                .createParser(f.mimetype)
                .loadFileBuffer(f.buffer);
            
            const rows = await parser.parse(false);

            for (const row in rows){
                const {
                    lrn,
                    studentFirstName,
                    studentMiddleName,
                    studentLastName,
                    section,
                    level,
                    grade,
                    gradingPeriod,
                    subject,
                    teacherIncharge,
                    schoolYear,
                    attendanceDaysPresent,
                    attendanceExcusedAbsences,
                    attendanceUnexcusedAbsences,
                } = rows[row];

                const recordData = {    
                    lrn,    
                    level,
                    section: section.toUpperCase(),
                    subject: subject.toUpperCase(),
                    teacherInCharge: teacherIncharge,
                    sy: schoolYear,
                };

                // data validation
                if (!lrn.match(/^\d{12}$/)) {
                    failed.push({
                        rowNumber: parseInt(row)+1,
                        reason: 'LRN must be 12 digits long.',
                    });
                    continue;
                }
                // 2 digit integer or 2 digit with decimal
                if (grade > 100 || grade < 60) {
                    failed.push({
                        rowNumber: parseInt(row)+1,
                        reason: 'Grade must be between 60 and 100.',
                    });
                    continue;
                }

                if (!gradingPeriod.match(/^\d{1}$/)) {
                    failed.push({
                        rowNumber: parseInt(row)+1,
                        reason: 'Grading period must be 1 digit long.',
                    });
                    continue;
                }

                if (!level.match(/^\d{1,2}$/)) {
                    failed.push({
                        rowNumber: parseInt(row)+1,
                        reason: 'Level must be 1 or 2 digits long.',
                    });
                    continue;
                }

                const enc_record = await panda.encryptObject(recordData);
                
                const grades = {
                    period: gradingPeriod,
                    score: grade,
                    attendance: {
                        daysPresent: attendanceDaysPresent,
                        excusedAbsences: attendanceExcusedAbsences,
                        unexcusedAbsences: attendanceUnexcusedAbsences
                    },
                }
                const enc_grades = await panda.encryptObject(grades);
                
                let record = await Record.findOne(enc_record);

                
                if (record) {
                    // update grades if not same grading period
                    if (!record.grades.find(g => g.period === enc_grades.period)) {
                        record.addGrade(enc_grades);
                        await record.save();
                        content.push(record);
                        continue;
                    }

                    failed.push({
                        rowNumber: parseInt(row)+1,
                        reason: 'Record already exists.',
                    });
                    continue;
                } 
                
                record = new Record(enc_record);
                record.addGrade(enc_grades);
                await record.save();
                content.push(record);
                
            }
        }

        res.status(200).json({
            content: {
                success_count: content.length,
                failed_count: failed.length,
                failed,
                success: content
            }
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

exports.updateGrades = async (req, res, next) => {
    try {
        const {
            lrn,
            section,
            level,
            subject,
            grades,
        } = req.body;

        const {sy} = req.query;

        const enc_body = await panda.encryptObject({
            lrn,
            section: section.toUpperCase(),
            level,
            subject: subject.toUpperCase(),
            sy
        });

        const record = await Record.findOne(enc_body);

        if (!record) throw new Exception('Record not found.', 404);

        for (const grade of grades) {
            const encPeriod = await panda.encrypt(grade.period.toString());
            const g = record.grades.find(g => g.period === encPeriod);
            if (!g) throw new Exception('Grade not found.', 404);
            // check if score is number string
            const score = parseInt(grade.score);
            if (isNaN(score)) return next(new Exception('Invalid score.', 400));

            g.score = await panda.encrypt(grade.score);
        }

        await record.save();

        res.status(200).json({
            content: record,
            message: 'Grades updated successfully.'
        });

    } catch (error) {
        next(error);
    }

};

exports.getGrades = async (req, res, next) => {
    try {
        let {
            lrn,
            sy
        } = req.query;

        if(!sy) sy = defaultSY(); 

        const records = await Record.find(await panda.encryptObject({
            lrn,
            sy
        }));

        if (!records || records.length === 0) throw new Exception('Record not found.', 404);

        // decrypt records
        for (let i = 0; i < records.length; i++) {
            const record = records[i].toObject();

            record.lrn = await panda.decrypt(record.lrn);
            record.level = await panda.decrypt(record.level);
            record.section = await panda.decrypt(record.section);
            record.subject = await panda.decrypt(record.subject);
            record.sy = await panda.decrypt(record.sy);
            record.teacherInCharge = await panda.decrypt(record.teacherInCharge);

            for (let j = 0; j < record.grades.length; j++) {
                const grade = record.grades[j];
                grade.period = await panda.decrypt(grade.period);
                grade.score = await panda.decrypt(grade.score);
                grade.attendance.daysPresent = await panda.decrypt(grade.attendance.daysPresent);
                grade.attendance.excusedAbsences = await panda.decrypt(grade.attendance.excusedAbsences);
                grade.attendance.unexcusedAbsences = await panda.decrypt(grade.attendance.unexcusedAbsences);
            }
            records[i] = Object.assign({}, record[i], record);
        }

        // sort grades according to grading period
        const sortedRecords = records.map(record => {
            record.grades.sort((a, b) => {
                return a.period - b.period;
            });

            return record;
        });

        res.status(200).json({
            content: sortedRecords,
            message: 'Records found.'
        });
    } catch (error) {
        next(error)
    }
};

exports.getStudent = async (req, res, next) => {
    try {
        const {
            lrn
        } = req.query;
        const student = await Student.findOne({
            lrn
        });
        if (!student) throw new Exception('Student not found.', 404);

        res.status(200).json({
            content: student,
            message: 'Student found.'
        });

    } catch (error) {
        next(error);
    }
};

exports.searchStudent = async (req, res, next) => {
    try {
        const {
            q
        } = req.query;
        const students = await Student.find({
            $or: [{
                    lrn: q
                },
                {
                    firstName: q
                },
                {
                    lastName: q
                },
                {
                    middleName: q
                },
                {
                    email: q
                }
            ]
        });
        if (!students || students.length === 0) throw new Exception('Student not found.', 404);

        res.status(200).json({
            content: students,
            message: 'Students found.'
        });

    } catch (error) {
        next(error);
    }
};

exports.getStudents = async (req, res, next) => {
    try {

        const students = await Student.find();
        res.status(200).json({
            content: students,
            message: 'Students found.'
        });

    } catch (error) {
        next(error);
    }
};

exports.addSubject = async (req, res, next) => {
    try {
        const {
            name
        } = req.body;
        const subject = new Subject({
            name: name.toUpperCase()
        });
        await subject.save();
        res.status(200).json({
            content: subject,
            message: 'Subject added successfully.'
        });
    } catch (error) {
        next(error);
    }
};

exports.updateStudent = async (req, res, next) => {
    try {
        const {
            id,
            firstName,
            lastName,
            middleName,
            email
        } = req.body;

        const student = await Student.findById(id);

        if (!student) {
            return next(new Exception('Student does not exist.', 400));
        }

        student.firstName = firstName;
        student.lastName = lastName;
        student.middleName = middleName;
        student.email = email;

        await student.save();

        res.status(200).json({
            content: student,
            message: 'Student updated successfully.'
        });

    } catch (error) {
        next(error);
    }
};

exports.removeStudent = async (req, res, next) => {
    try {
        const {
            id
        } = req.query;

        const student = await Student.findById(id);

        if (!student) {
            return next(new Exception('Student does not exist.', 400));
        }

        const records = await Record.find(await panda.encryptObject({
            lrn: student.lrn,
        }));

        for (let i = 0; i < records.length; i++) {
            await records[i].remove();
        }

        const sessions = await StudentSession.find({
            studentId: student._id
        });

        for (let i = 0; i < sessions.length; i++) {
            await sessions[i].remove();
        }

        await student.remove();

        res.status(200).json({
            content: null,
            message: 'Student removed successfully.'
        });

    } catch (error) {
        next(error);
    }
};

exports.purgeStudents = async (req, res, next) => {
    try {
        await Student.deleteMany({});
        await Record.deleteMany({});
        await StudentSession.deleteMany({});

        res.status(200).json({
            content: null,
            message: 'Students purged successfully.'
        });
    } catch (error) {
        next(error);
    }
};

exports.removeSubject = async (req, res, next) => {
    try {
        const {
            name
        } = req.query;
        const subjectExists = await Subject.findOne({
            name: name.toUpperCase()
        });

        if (!subjectExists) {
            return next(new Exception('Subject does not exist.', 400));
        }

        await Subject.deleteOne({
            name: name.toUpperCase()
        });

        res.status(200).json({
            content: null,
            message: 'Subject removed successfully.'
        });

    } catch (error) {
        next(error);
    }
};

exports.getSubjects = async (req, res, next) => {
    try {
        const subjects = await Subject.find();
        res.status(200).json({
            content: subjects,
            message: 'Subjects found.'
        });
    } catch (error) {
        next(error);
    }
};

exports.deactivateStudents = async (req, res, next) => {
    try {

        const {
            lrns
        } = req.body;

        for (let i = 0; i < lrns.length; i++) {
            const lrn = lrns[i];
            const student = await Student.findOne({
                lrn
            });
            if (!student) throw new Exception('Student not found.', 404);
            student.isActive = false;
            await student.save();
        }

        res.status(200).json({
            content: null,
            message: 'Students deactivated successfully.'
        });

    }catch(error){
        next(error)
    }
};

exports.activateStudents = async (req, res, next) => {
    try {

        const {
            lrns
        } = req.body;

        for (let i = 0; i < lrns.length; i++) {
            const lrn = lrns[i];
            const student = await Student.findOne({
                lrn
            });
            if (!student) throw new Exception('Student not found.', 404);
            student.isActive = true;
            await student.save();
        }

        res.status(200).json({
            content: null,
            message: 'Students activated successfully.'
        });

    }catch(error){
        next(error)
    }
};

exports.getActiveAdminSessions = async (req, res, next) => {
    try {
        const admin = req.user;
        const sessions = admin.refreshTokens;
        sessions.forEach(session => {
            delete session.refreshToken;
        });
        res.status(200).json({
            content: sessions,
            message: 'Sessions found.'
        });

    }catch(error){
        next(error)
    }
};

exports.deleteActiveAdminSession = async (req, res, next) => {
    try {
        const {
            id
        } = req.query;
        const admin = req.user;
        const sessions = admin.refreshTokens;
        const newSessions = sessions.filter(session => session.id.toString() !== id);
        admin.refreshTokens = newSessions;
        await admin.save();
        res.status(200).json({
            content: null,
            message: 'Session deleted successfully.'
        });

    }catch(error){
        next(error)
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const {
            currentPassword,
            newPassword
        } = req.body;


        if(!currentPassword || !newPassword){
            return next (new Exception('Please fill out all fields.', 400));
        } 

        const admin = await Admin.findById(req.user._id);

        if(!admin) return next(new Exception('Admin not found.', 404));

        admin.comparePassword(currentPassword, (err, isMatch) => {
            if (err) return next(new Exception('Incorrect password.', 400));
            if (!isMatch) return next(new Exception('Incorrect password.', 400));

            admin.password = newPassword;
            admin.save();
            
            res.status(200).json({
                success: true,
                message: 'Password changed successfully.'
            });
        });

    }catch(error){
        next(error)
    }
};

exports.deleteAccount = async (req, res, next) => {
    try {
        const {
            password
        } = req.body;

        if(!password){
            return next (new Exception('Type the password to delete this account.', 400));
        } 

        const admin = await Admin.findById(req.user._id);

        if(!admin) return next(new Exception('Admin not found.', 404));

        admin.comparePassword(password, (err, isMatch) => {
            if (err) return next(new Exception('Incorrect password.', 400));
            if (!isMatch) return next(new Exception('Incorrect password.', 400));

            admin.remove();
            
            res.status(200).json({
                success: true,
                message: 'Account deleted successfully.'
            });
        });

    }catch(error){
        next(error)
    }
};