const Exception = require('../utils/Exception');
const { sendPasswordMail } = require('../mail/mailer');
const {getIdentifier, createPlaceholder} = require('../utils/getIdentifier');
const Student = require('../models/Student.model');
const StudentSession = require('../models/StudentSession.model');
const tokenConfig = require('../token.config');
const Record = require('../models/Record.model');
const panda = require('../utils/encryption/Panda');

const defaultSY = require('../utils/defaultSY')

const fs = require('fs');
const path = require('path');

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


            if(!student.isActive) return next(new Exception('Your account is not yet activated. Please contact the administrator.', 400));

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
                   throw new Exception('Error sending password to email.', 500);
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
        const subject = 'Welcome to Outscore | Your New Password';
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
                throw new Exception('Error sending password to email.', 500);
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

        if(!student.isActive) return next(new Exception('Student is not active.', 400));

        student.identifier = createPlaceholder();
        await student.save();
        
        const refresh = await student.generateRefreshToken();

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
    let {sy} = req.query;

    if(!sy) sy = defaultSY();

    const records = await Record.find(await panda.encryptObject({
        lrn: student.lrn,
        sy
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
        record.sy = await panda.decrypt(record.sy);

        for(let j = 0; j < record.grades.length; j++){
            const grade = record.grades[j];
            grade.period = await panda.decrypt(grade.period);
            grade.score = await panda.decrypt(grade.score);
            grade.attendance.totalDays = await panda.decrypt(grade.attendance.totalDays);
            grade.attendance.daysAbsent =await panda.decrypt(grade.attendance.daysAbsent);
        }

        records[i] = Object.assign({}, record[i], record);
    }

    const sortedRecords = records.map(record => {
        record.grades.sort((a, b) => {
            return a.period - b.period;
        });

        return record;
    });

    res.status(200).json({
        content: sortedRecords,
        message: 'Grades retrieved successfully.'
    });
}

exports.getProfile = async (req, res, next) => {
    const student = req.user;
    res.status(200).json({
        content: {
            id: student._id,
            lrn: student.lrn,
            firstName: student.firstName,
            middleName: student.middleName,
            lastName: student.lastName,
            email: student.email,
            profilePicture: student.profilePicture,
            isActive: student.isActive
        },
        message: 'Profile retrieved successfully.'
    });
}

exports.updateProfilePicture = async (req, res, next) => {
    try {
        const student = req.user;
        const { file } = req;

        // get file name
        const fileName = file.filename;
        const fileExtension = file.originalname.split('.').at(-1);

        // get server url
        const serverUrl = req.protocol + '://' + req.get('host');

        const pathName = `${serverUrl}/storage/profiles/${fileName}`;

        // delete old profile picture
        if (student.profilePicture) {
            // path looks like this: "http://localhost:5000/storage/profiles/8a57fad56f4a706ec4dc090bbe92e894"

            const oldFileName = student.profilePicture.split('/').at(-1);
            const pathName = path.join(__dirname, `../storage/profiles/${oldFileName}`);
            if(fs.existsSync(pathName)){
                fs.unlinkSync(pathName);
            }
        }

        student.profilePicture = pathName;
        await student.save();

        res.status(200).json({
            path: pathName,
            message: 'Profile picture updated successfully.'
        });
    } catch (error) {
        next(error);
    }
}

exports.updateProfile = async (req, res, next) => {
    try {
        const student = req.user;
        const { firstName, middleName, lastName, email } = req.body;

        student.firstName = firstName;
        student.middleName = middleName;
        student.lastName = lastName;
        student.email = email;

        await student.save();

        res.status(200).json({
            message: 'Profile updated successfully.'
        });
    } catch (error) {
        next(error);
    }
}