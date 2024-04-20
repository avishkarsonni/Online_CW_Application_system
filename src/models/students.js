const mongoose = require("mongoose");
const StudSchema = new mongoose.Schema({
crn: {
    type: Number,
    required: true,
    unique: true
},
cccrn:{
    type:Number,
    required:true
},
password: {
    type: Number, // Assuming passwords are strings
    required: true
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
class: {
    type: String,
    required: true
},
div: {
    type: String,
    required: true
},
Department: {
    type: String,
    required: true
},
mobile: {
    type: Number,
    required: true,
    unique: true
},
name: {
    type: String,
    required: true
},
Address: {
    type: String,
    required: true
},
CurrentCC: {
    type: String, // Assuming this is the name of the current class coordinator
    required: true
},
CurrentHod: {
    type: String, // Assuming this is the name of the current class coordinator
    required: true
},
CurrentDean: {
    type: String, // Assuming this is the name of the current class coordinator
    required: true
},
Roll: {
    type: Number,
    required: true
},
NetAttendace: {
    type: Number,
    required: true
},
ThAttendance: {
    type: Number,
    required: true
},
PrAttendance: {
    type: Number,
    required: true
},
AdmissionYear: {
    type: Number,
    required: true
}
})

//now we need collection
const Students = new mongoose.model("student", StudSchema);
module.exports = Students;
