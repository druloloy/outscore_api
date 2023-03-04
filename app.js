/**
 * FORMAT by druloloy | git@github.com/druloloy
 */

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

// remove console logs on prod
if (process.env.NODE_ENV === 'production') {
	console.log = () => {};
}



const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middlewares/errorHandler');
const Dictionary = require('./utils/dictionary/phraser');

const PORT = process.env.PORT || 5000;

// init express
const app = express();
app.use(express.json()); // to handle api calls responses in json format
app.use(cors({
	origin: [
		'http://localhost:3000',
		'https://outscore-taguig.netlify.app',
		'https://outscore-admin.netlify.app/'
	],
	credentials: true,
})); 

app.use(cookieParser(process.env.COOKIE_SECRET, require('./cookie.config'))); 

// init Dictionary
new Dictionary();

// database
require('./database/connection').connect();


// routes
app.use('/api/admin', require('./routes/admin.route'));
app.use('/api/student', require('./routes/student.route'));
app.use('/api/auth', require('./routes/auth.route'));

app.use(errorHandler); // should always be the last middleware
// no more middleware after this one

// init server and listen
const serverHandler = () => {
    console.log('Server is running on port: ', PORT);
}
const server = app.listen(PORT, serverHandler);


/**
 * For handling unhandled rejections, 
 * for additional security and debugging efficiency
 */
const rejectionHandler = (err) => {
    console.warn('Server timed out.');
	console.log(`ERROR LOG: ${err}`);

	/**Close the server if an error is unhandled. */
	server.close(_=>process.exit(1));		
}
process.on('unhandledRejection', rejectionHandler);

