const Admin = require('../models/Admin.model');
const SheetParser = require('../utils/SheetParser');
const Exception = require('../utils/Exception');
const cookieConfig = require('../cookie.config');
const Record = require('../models/Record.model');
const Subject = require('../models/Subject.model');

const panda = require('../utils/encryption/Panda');
const tokenConfig = require('../token.config');

cookieConfig.maxAge = 1000 * 60 * 15; // 15 minutes


exports.signup = async (req, res) => {
    try {
        const {username, password} = req.body;
        const admin = new Admin({username, password});
        await admin.save();
        res.status(201).json({message: 'Admin created successfully'});
    } catch (error) {
        next(error);
    }
}

exports.login = async (req, res) => {
    try {
        const {username, password} = req.body;
        const admin = await Admin.findOne({username});
        if (!admin) throw new Exception("Invalid username/password.", 401);

        admin.comparePassword(password, async (err, isMatch) => {
            if (err) throw new Exception("Invalid username/password.", 401);
            if (!isMatch) throw new Exception("Invalid username/password.", 401);

            const refresh = await admin.generateRefreshToken();
            const access = admin.generateAccessToken();

            res.cookie('access', access, {
                httpOnly: false,
                secure: true,
                sameSite: 'none',
                maxAge: tokenConfig.ACCESS.MAX_AGE
            });
    
            res.cookie('refresh', refresh, {
                httpOnly: true,
                secure: true,
                maxAge: tokenConfig.REFRESH.MAX_AGE,
                sameSite: 'none',
                signed: true
            });

            res.status(200).json({
                message: 'Login successful'
            });
        });
    } catch (error) {
        next(error);
    }
}

exports.logout = async (req, res, next) => {
    try {
        const admin = req.user;
        const {refreshToken} = req.signedCookies;
        
        console.log(admin, refreshToken)

        admin.refreshTokens = admin.refreshTokens.filter(token => token !== refreshToken);
        await admin.save();

        res.clearCookie('refresh');
        res.clearCookie('access');
        res.status(200).json({message: 'Logout successful'});
    }
    catch (error){
        next(error);
    }
}
exports.uploadGrades = async (req, res, next) => {
    try {
      const { file } = req;
      const parser = SheetParser.createParser(file.mimetype).loadFileBuffer(file.buffer);
      const { studentGradeReport: studentReport, totalDays, daysAbsent } = await parser.parse();
  
      const subject = await Subject.findOne({ name: studentReport.subject.toLowerCase() });
      if (!subject) {
        return next(new Exception('Subject does not exist.', 400));
      }
  
      const { lrn, subject: subjectName } = studentReport;

      if(!lrn.match(/^\d{12}$/))
        return res.status(400).json({message: 'LRN must be 12 digits long'});

      const recordData = {
        lrn,
        level: studentReport.level,
        section: studentReport.section,
        subject: subjectName.toLowerCase(),
        teacherInCharge: studentReport.teacherIncharge,
      };
      const grades = {
        period: studentReport.gradingPeriod,
        score: studentReport.grade,
        attendance: { totalDays: JSON.stringify(totalDays), daysAbsent: JSON.stringify(daysAbsent) },
      };
  
      let content;
      let record = await Record.findOne(await panda.encryptObject({ lrn, subject: subjectName.toLowerCase() }));
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
  
      return res.status(200).json({ content, message: 'Grades uploaded successfully' });
    } catch (error) {
        console.log(error);
      next(error);
    }
  };

// exports.uploadGrades = async (req, res, next) => {
//     try {
//         let content = '';
//         const file = req.file;
//         const parser = SheetParser
//                         .createParser(file.mimetype)
//                         .loadFileBuffer(file.buffer);

//         const result = await parser.parse();
//         const studentReport = result.studentGradeReport;

//         const subjectExist = Subject.findOne({
//             name: studentReport.subject.toLowerCase()
//         })

//         if (!subjectExist) {
//             return next(new Exception('Subject does not exist.', 400));
//         }

//         const student = await Record.findOne(await panda.encryptObject({
//             lrn: studentReport.lrn,
//             subject: studentReport.subject.toLowerCase(),
//         }));

//         if (student) {  
//             const grades = {
//                 period: studentReport.gradingPeriod,
//                 score: studentReport.grade,
//                 attendance: {
//                     totalDays: JSON.stringify(result.totalDays),
//                     daysAbsent: JSON.stringify(result.daysAbsent)
//                 }
//             }
//             student.addGrade(await panda.encryptObject(grades));
//             await student.save();
//             content = student;
//         }
//         else{
//             const recordData = {
//                 lrn: studentReport.lrn,
//                 level: studentReport.level,
//                 section: studentReport.section,
//                 subject: studentReport.subject.toLowerCase(),
//                 teacherInCharge: studentReport.teacherIncharge,
//             };

//             const grades = {
//                 period: studentReport.gradingPeriod,
//                 score: studentReport.grade,
//                 attendance: {
//                     totalDays: JSON.stringify(result.totalDays),
//                     daysAbsent: JSON.stringify(result.daysAbsent)
//                 }
//             }
//             const record = new Record(await panda.encryptObject(recordData));
//             record.addGrade(await panda.encryptObject(grades));
//             await record.save();
//             content = record;
//         }

//         return res
//             .status(200)
//             .json({
//                 content,
//                 message: 'Grades uploaded successfully'
//             });

//     } catch (error) {
//         next(error);
//     }
// }

exports.getGrades = async (req, res, next) => {
    try {
        const {lrn} = req.body;
        const records = await Record.find(await panda.encryptObject({
            lrn,
        }));
        if (!records || records.length === 0) throw new Exception('Record not found.', 404);

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
            message: 'Records found.'
        });
    } catch (error) {
        next(error)
    }
}

exports.addSubject = async (req, res, next) => {
    try{
        const {name} = req.body;
        const subject = new Subject({
            name: name.toLowerCase()
        });
        await subject.save();
        res.status(200).json({
            content: subject,
            message: 'Subject added successfully.'
        });
    }
    catch(error){
        next(error);
    }
}

exports.removeSubject = async (req, res, next) => {
    try {
        const { name } = req.query;
        const subjectExists = await Subject.findOne({
            name: name.toLowerCase()
        });

        if (!subjectExists) {
            return next(new Exception('Subject does not exist.', 400));
        }

        await Subject.deleteOne({
            name: name.toLowerCase()
        });

        res.status(200).json({
            content: null,
            message: 'Subject removed successfully.'
        });

    } catch (error) {
        next(error);
    }
}

exports.getSubjects = async (req, res, next) => {
    try{
        const subjects = await Subject.find();
        res.status(200).json({
            content: subjects,
            message: 'Subjects found.'
        });
    }
    catch(error){
        next(error);
    }
}