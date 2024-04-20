const mongoose = require("mongoose");
const CCSchema = new mongoose.Schema({
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
class: {
    type: String,
    required: true
},
Department: {
    type: String,
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
const Class_cordinators = new mongoose.model("class_coordinator", CCSchema);
module.exports = Class_cordinators;
