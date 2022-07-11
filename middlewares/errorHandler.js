const Exception = require('../utils/Exception');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
	let error = { ...err };
	error.message = err.message;
	
	console.log(err);	
	

	if(err.name === 'CastError'){
		const message = 'Address not found!';
		error = new Exception(message, 404);
	}
	
	// Mongoose validation error for duplicate unique fields
	if(err.code === 11000){
		const notUnique = Object.keys(err.keyValue);
		const message = `Please provide a unique information for ${notUnique[0]}.`;
		error = new Exception(message, 400);
	}

	if(err.name === 'ValidationError'){
		const message = Object.values(err.errors).map(val => val.message);
		error = new Exception(message, 400);
	}	
	if(err.name === 'TypeError'){
		const message = 'Search not found.';
		error = new Exception(message, 404);
	}
    
	if(err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError'){
		const message = 'Access token has expired or is invalid!';
		error = new Exception(message, 403);
	}	

	res.status(error.statusCode || 500).json(
		{
			success: false,
			error: error.message || 'Internal Server Error.',
		}
	);  
};

module.exports = errorHandler;