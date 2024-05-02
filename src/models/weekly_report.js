const mongoose = require('mongoose');

const weeklyReportSchema = new mongoose.Schema({
    weekStartDate: {
        type: Date,
        required: true
    },
    weekEndDate: {
        type: Date,
        required: true
    },
    cwRequestsCount: {
        type: Number,
        required: true
    }
});

const WeeklyReport = mongoose.model('Weeklyreports', weeklyReportSchema);

module.exports = WeeklyReport;
