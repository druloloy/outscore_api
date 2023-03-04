const mongoose = require('mongoose');

const uri = process.env.NODE_ENV === 'production' ? 
process.env.MONGO_PROD : 
process.env.MONGO_DEV;

exports.connect = function () {
    mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: 'outscore',
    });
    mongoose.connection.on('connected', () => {
        console.log('Mongoose is connected');
    });
};