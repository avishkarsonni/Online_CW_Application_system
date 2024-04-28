const mongoose = require('mongoose');

const pieSchema = new mongoose.Schema({
    allpending: {
        type: Number,
        required: true
    },
    allrejected: {
        type: Number,
        required: true
    },
    allaccepted: {
        type: Number,
        required: true
    },
    numid:{
        type: Number,
        required: true
    }
});

const pieReport = mongoose.model('piereports', pieSchema);

module.exports = pieReport;
