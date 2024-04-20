const mongoose = require("mongoose");
const DeanSchema = new mongoose.Schema({
crn: {
    type: Number,
    required: true,
    unique: true
},
password: {
    type: Number,
    required: true
},
mobile:{
    type:Number,
    required: true,
    unique: true
},
profilephoto: {
    type: String, // Assuming storing file paths as strings
    required: true
},
email: {
    type: String,
    required: true,
    unique: true
},
name: {
    type: String,
    required: true
}
})

//now we need collection
const Deans = new mongoose.model("dean", DeanSchema);
module.exports = Deans;
