const Exception = require('../utils/Exception');
const { sendPasswordMail } = require('../mail/mailer');
const {getIdentifier, createPlaceholder} = require('../utils/getIdentifier');
const Student = require('../models/Student.model');
const StudentSession = require('../models/StudentSession.model');
const tokenConfig = require('../token.config');
const Record = require('../models/Record.model');
const panda = require('../utils/encryption/Panda');

exports.signup = async (req, res, next) => {
    try {
        /**
         * Boundaries
         * 1. If user is registered, find his credential, send a new password
         * 2. If user is not registered, create his credential
         */

        const { lrn, firstName, middleName, lastName, email, newUser } = req.body;

        if (!newUser){
            // 1. If user is registered, find his credential, send a new password

            const student = (await Student.find({lrn})).at(0);
            if (!student) return next(new Exception('Student not found. Please create an account. If you think this is an error, please contact the administrator.', 400));

            const password = student.generatePassword();
            student.identifier = getIdentifier(password);
            await student.save();


            // Send password to email
            const subject = 'Outscore | Your New Password';
            const data = {
                firstName: student.firstName.toUpperCase(),
                lastName: student.lastName.toUpperCase(),
                password
            }
            return await sendPasswordMail(student.email, subject, data)
                .then(() => {
                    res.status(200).json({
                        message: 'Password sent to your email.',
                    })
                })
                .catch((err) => {
                   next(new Exception('Error sending password to email.', 500));
                });
        }

        // 2. If user is not registered, create his credential
        const student = new Student({
            lrn,
            firstName,
            middleName,
            lastName,
            email
        });

        const password = student.generatePassword();
        student.identifier = getIdentifier(password);
        await student.save();   

        // Send password to email
        const subject = 'Outscore | Your New Password';
        const data = {
            firstName: student.firstName.toUpperCase(),
            lastName: student.lastName.toUpperCase(),
            password
        }

        await sendPasswordMail(student.email, subject, data)
            .then(() => {
                res.status(200).json({
                    message: 'Password sent to your email.',
                })
            })
            .catch(async (err) => {
                await student.remove();
                next(new Exception(err, 500));
            }
        );

    } catch (error) {
        next(error);
    }
}


exports.login  = async (req, res, next) => {
    try {
        const { code } = req.body;

        const identifier = getIdentifier(code);

        const student = (await Student.find({identifier})).at(0);
        if (!student) return next(new Exception('Invalid credentials.', 400));

        student.identifier = createPlaceholder();
        await student.save();
        
        const session = await student.generateRefreshToken();
        const access = await student.generateAccessToken();

        res.status(200).json({
            content: {
                id: student._id,
                lrn: student.lrn,
                name: `${student.firstName} ${student.lastName}`
            },
            token: refresh,
            message: 'Login successful.'
        });
    } catch (error) {
        next(error)
    }
}

exports.logout = async (req, res, next) => {
    try {
        
        const { refresh } = req.signedCookies;
        if (!refresh) return next(new Exception('Invalid credentials.', 400));

        const session = (await StudentSession.find({session: refresh})).at(0);
        if (!session) return next(new Exception('Invalid credentials.', 400));

        await session.remove();

        res.clearCookie('access');
        res.clearCookie('refresh');

        res.status(200).json({
            message: 'Logout successful.'
        });
    } catch (error) {
        next(error)
    }
}

exports.getGrades = async (req, res, next) => {
    const student = req.user;
    const records = await Record.find(await panda.encryptObject({
        lrn: student.lrn,
    }));
    if (!records || records.length === 0){ 
        return res.status(200).json({
            content: [],
            message: 'No grades found.'
        })
    }

    // decrypt records
    for(let i = 0; i < records.length; i++){
        const record = records[i].toObject();

        record.lrn = await panda.decrypt(record.lrn);
        record.level = await panda.decrypt(record.level);
        record.section = await panda.decrypt(record.section);
        record.subject = await panda.decrypt(record.subject);
        record.teacherInCharge = await panda.decrypt(record.teacherInCharge);

        for(let j = 0; j < record.grades.length; j++){
            const grade = record.grades[j];
            grade.period = await panda.decrypt(grade.period);
            grade.score = await panda.decrypt(grade.score);
            grade.attendance.totalDays = await panda.decrypt(grade.attendance.totalDays);
            grade.attendance.daysAbsent =await panda.decrypt(grade.attendance.daysAbsent);
        }

        records[i] = Object.assign({}, record[i], record);

    }

    res.status(200).json({
        content: records,
        message: 'Grades retrieved successfully.'
    });
}