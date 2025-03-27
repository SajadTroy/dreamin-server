// app.js is a file that contains the main code for the application. It connects to the MongoDB database, sets up the Express server, and listens for incoming requests. It also uses the nodemailer library to send emails to users. The app.js file is the entry point for the application and is responsible for setting up the environment and starting the server.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const colors = require('colors');
const UAParser = require('ua-parser-js');
const cors = require('cors');
const compression = require('compression');
const connectDB = require("./data/config");
const app = express();
const PORT = process.env.PORT || 3004;


const accessLogStream = fs.createWriteStream(
    path.join(__dirname, "access.log"),
    { flags: "a" }
);


morgan.token('status', (req, res) => {
    const status = res.statusCode;
    let color = status >= 500 ? 'red'
        : status >= 400 ? 'yellow'
            : status >= 300 ? 'cyan'
                : status >= 200 ? 'green'
                    : 'reset';

    return colors[color](status);
});

app.use(
    morgan((tokens, req, res) => {
        return [
            colors.blue(tokens.method(req, res)),
            colors.magenta(tokens.url(req, res)),
            tokens.status(req, res),
            colors.cyan(tokens['response-time'](req, res) + ' ms'),
        ].join(' ');
    })
);

app.use(morgan("combined", { stream: accessLogStream }));

app.use(cors());

app.use(compression());

app.use((req, res, next) => {
    const userAgent = req.headers['user-agent'];
    const parser = new UAParser(userAgent);
    const device = parser.getDevice();
    req.device = device;
    next();
});
app.use(express.json());

app.use('/api/user/', require('./route/user/user'));

app.listen(PORT, connectDB(), () => {
    console.log(`🚀 Listening at http://127.0.0.1:${PORT}/`);
});