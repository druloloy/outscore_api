/**
 * FORMAT by druloloy | git@github.com/druloloy
 */

const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');

const PORT = process.env.PORT || 5000;

// init express
const app = express();
app.use(express.json()); // to handle api calls responses in json format
app.use(cors()); 



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

