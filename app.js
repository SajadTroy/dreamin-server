require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const colors = require('colors');
const UAParser = require('ua-parser-js');
const cors = require('cors');
const rss_fetch = require('./scripts/rss_fetch');
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

app.use('/api/fact_check/', require('./route/fact_check'));

app.listen(PORT, connectDB(), () => {
    console.log(`🚀 Listening at http://127.0.0.1:${PORT}/`);
});