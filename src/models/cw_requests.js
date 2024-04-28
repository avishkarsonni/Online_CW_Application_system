const { Timestamp } = require("mongodb");
const mongoose = require("mongoose");
const CWSchema = new mongoose.Schema({
srno:{
    type: Number,
    unique:true,
    required: true,
},
roll:{
    type: Number,
    required: true
},
sect:{
    type:String,
    required:true
},
netattendance:{
    type: Number,
    required: true
},
cy:{
    type: String,
    required: true
},
name:{
    type: String,
    required: true
},
cccrn:{
    type: Number,
    required: true
},
studcrn: {
    type: Number,
    required: true
},
currentcc: {
    type: String,
    required: true
},
department:{
    type: String,
    required: true
},
currenthod: {
    type: String,
    required: true
},
currentdean: {
    type: String,
    required: true
},
studemail:{
    type: String,
    required: true,
},
dateofdeparture:{
    type: Date,
    required: true
},
dateofreturn:{
    type: Date,
    required: true
},
reason:{
    type: String,
    required:true
},
proof:{
    type: String,
    required: true
},
cemail:{
    type: String,
    required: true
},
profileimage:{
    type: String,
    required: true
},
reviwedByCC:{
    type:String,
    default: "pending"
},
reviwedByHod:{
    type:String,
    default: "pending"
},
reviwedBYDean:{
    type:String,
    default: "pending"
}}, {
    timestamps: true, // This will automatically add createdAt and updatedAt fields
    expireAfterSeconds: 2592000
});
//now we need collection
const Cws = new mongoose.model("cw_request", CWSchema);
module.exports = Cws;
