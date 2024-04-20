const { Timestamp } = require("mongodb");
const mongoose = require("mongoose");
const CWSchema = new mongoose.Schema({
srno:{
    type: Number,
    unique:true,
    required: true,
},
cccrn:{
    type: Number,
    required: true
},
studcrn: {
    type: Number,
    required: true,
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
    timestamps: true // This will automatically add createdAt and updatedAt fields
});
//now we need collection
const Cws = new mongoose.model("cw_request", CWSchema);
module.exports = Cws;
