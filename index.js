const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const { logger } = require('./helpers/logger');
var mysql = require('mysql2');


const app = express();
app.use(cors())

app.get('/', (req, res) => {
    res.send("hello");
});


// const ShiftOperator = require('./routes/machine/ShiftOperator');
// app.use("/ShiftOperator", ShiftOperator);
 

const jobWork = require('./routes/orders/JobWorkCreate');
app.use("/jobworkCreate", jobWork);

const scheduleList = require('./routes/orders/ScheduleList');
app.use("/scheduleList", scheduleList);

 
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({
        error: {
            status: err.status || 500,
            message: err.message,
        }
    })
    logger.error(`Status Code : ${err.status}  - Error : ${err.message}`);
})


// starting the server
app.listen(process.env.PORT, () => {
    console.log('listening on port ' + process.env.PORT);
    logger.info('listening on port ' + process.env.PORT);
});