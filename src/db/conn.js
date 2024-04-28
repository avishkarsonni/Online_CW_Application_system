const mongoose = require("mongoose");

mongoose.connect("mongodb://0.0.0.0:27017/classworksystem")
    .then(() => {
        console.log("Connection Successful!! ");
    })
    .catch((error) => {
        console.log("Connection Failed!", error);
    });
