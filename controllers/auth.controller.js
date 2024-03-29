const Student = require('../models/Student.model');
const Admin = require('../models/Admin.model');
const {verify} = require('jsonwebtoken');
const tokenConfig = require('../token.config');
const Exception = require('../utils/Exception');
const StudentSession = require('../models/StudentSession.model');

exports.getStudentAccess = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return next(new Exception('Refresh token not found.', 400));
        }

        const { id } = verify(refreshToken, tokenConfig.REFRESH.SECRET);
        
        const studentSession = await StudentSession.findById(id);

        if (!studentSession) {
            return next(new Exception('Session expired. Login again.', 400));
        }

        const student = await Student.findById(studentSession.studentId).select('-password -__v');

        if (!student) {
            return next(new Exception('Student not found.', 400));
        }

        const access = await student.generateAccessToken();

        res.status(200).json({
            token: access,
            message: 'Access token refreshed successfully.'
        });
    } catch (error) {
        next(error);
    }
}

exports.getAdminAccess = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if(!refreshToken){
            return next(new Exception('Refresh token not found.', 400));
        }

        const {id} = verify(refreshToken, tokenConfig.REFRESH.SECRET);

        const admin = await Admin.findById(id).select('-password -__v');
    
        if(!admin){
            return next(new Exception('Admin not found.', 400));
        }

        // check if refresh token is present in admin's refreshTokens array
        const refreshTokens = admin.refreshTokens.map(item => item.refreshToken);
        if(!refreshTokens.includes(refreshToken)){
            return next(new Exception('Invalid refresh token.', 400));
        }

        const access = await admin.generateAccessToken();

        res.status(200).json({
            token: access,
            message: 'Access token refreshed successfully.'
        });
    } catch (error) {
        next(error)
    }
}