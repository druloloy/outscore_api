const Admin = require("../models/Admin.model");
const Student = require("../models/Student.model");
const Exception = require("../utils/Exception");
const { verifyAccessToken } = require("./token");

exports.studentAuth = async (req, res, next) => {
    try {
        const headers = req.headers;
        if(!headers.authorization){
            return res.status(401).json({
                message: 'Authentication error'
            });
        }

        const token = headers.authorization.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                message: 'Authentication error'
            });
        }
        const decoded = verifyAccessToken(token);
        if (!decoded) next(new Exception('Authentication error', 401));

        const student = await (Student.findById(decoded.id)).select('-password -__v');
        if (!student) next(new Exception('Authentication error', 401));

        req.user = student;
        next();
    }
    catch (error){
        next(new Exception('Authentication error', 401));
    }
}

exports.adminAuth = async (req, res, next) => {     
    try {
        const headers = req.headers;
        if(!headers.authorization){
            return res.status(401).json({
                message: 'Authentication error'
            });
        }

        const token = headers.authorization.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                message: 'Authentication error'
            });
        }
        const decoded = verifyAccessToken(token);
        const user = await (Admin.findById(decoded.id)).select('-password -__v');
        if (!user) next(new Exception('Authentication error', 401));
        
        req.user = user;
        next();
    }
    catch (error){
        next(new Exception('Authentication error', 401));
    }
}