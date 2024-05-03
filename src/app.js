const handlebars = require("handlebars");
const express = require("express");
const path = require("path");
const hbs = require("hbs");
const multer = require("./middlewares/upload");
const mongoose = require("mongoose");
const notifier = require('node-notifier');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const bodyParser = require('body-parser');
//"use strict";
//const prompt = require('prompt-sync')({sigint: true});
const moment = require('moment');
const WeeklyReport = require("./models/weekly_report");
const cron = require('node-cron');
const router = express.Router();


const app = express();
const port = process.env.PORT || 5500;
app.use(express.urlencoded({ extended: true }));
const static_path = path.join(__dirname,"../public");
app.use(express.static(static_path));
const template_path = path.join(__dirname,"../templates/views");
const partials_path = path.join(__dirname,"../templates/partials");
app.set("view engine", "hbs");
app.set("views", template_path);
hbs.registerPartials(partials_path);
// Register a Handlebars helper for formatting dates
hbs.registerHelper('formatDate', function(dateString) {
    // Use moment.js to format the date string
    return moment(dateString).format('DD-MMM-YYYY');
});

/*
hbs.registerHelper("reviewed",
 function(reviwedByCC, reviwedByHod, reviwedByDean){
	if(reviwedByCC == "pending" && reviwedByHod == "pending" && reviwedByDean == "pending"  ) {
      return "To be reviewed";
    }
  	else if(reviwedByCC == "accepted" && reviwedByHod == "pending" && reviwedByDean == "pending" ){
      return "accepted by cc";
    }else if(reviwedByCC == "accepted" && reviwedByHod == "accepted" && reviwedByDean == "pending" ){
      return "accepted by hod";
    }
  else if(reviwedByCC == "accepted" && reviwedByHod == "accepted" && reviwedByDean == "accepted" ){
      return "congratulations";
    }
  else if(reviwedByCC == "rejected" && reviwedByHod == "pending" && reviwedByDean == "pending" ){
      return "denied by cc";
    }
  else if(reviwedByCC == "accepted" && reviwedByHod == "rejected" && reviwedByDean == "pending" ){
      return "denied by hod";
    }
  else if(reviwedByCC == "accepted" && reviwedByHod == "accepted" && reviwedByDean == "rejected" ){
      return "denied by dean";
    }
  
});

*/

//const MongoClient = require("mongodb").MongoClient;
//app.use(express.json());
//console.log(path.join(__dirname,"../public"));
//const student = require("models/student");

app.set('view engine', 'hbs');
app.set('views', template_path);
hbs.registerPartials(partials_path);

const db = require("./db/conn");
const Students = require("./models/students");
const Class_Coordinators = require("./models/class_coordinators");
const Deans = require("./models/deans");
const Hods = require("./models/hods");
const Cws = require("./models/cw_requests");
const { type } = require("os");
const { strict } = require("assert");
const pieReport = require('./models/pie');
var ucrn, ccrn, hcrn, dcrn;
//var database;
app.use((req, res, next) => {
    req.db = db;
    next();
});


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'classsworks@gmail.com',
      pass: 'qbuv lqyd syoi zftr'
    }
  });

app.get("/",(req, res)=>{
    
    res.render("login")
});

/*app.get("/api/student",(req, res)=>{
    database.collection('student').find({}).toArray((err, result)=>{
        if(err) throw err
        res.send(result);
    })
});*/

app.get("/granted_cws",(req, res)=>{
    res.render("granted_cws");
});
app.post("/granted_cwss",async (req, res)=>{
    try {
        const dept = req.body.dept;
        const classroom = req.body.classroom;
        const division = req.body.division;
        const cwRequests = await Cws.find({
            $and:[
            {sect: division},
            {cy: classroom},
            {department: dept},
            {reviwedByCC: 'accepted'},
            {reviwedByHod: 'accepted'},
            {reviwedBYDean: 'accepted'},
            ]
        });
        console.log(cwRequests);
        
        res.render("granted_cws",{cwData:cwRequests});
    } catch (error) {
       
    }
    

});
app.post("/statistics", async (req, res) => {
    try {
        const weeklyReports = await WeeklyReport.find(); // Fetch all documents from the weeklyreport collection
        const data = {
            xValues: weeklyReports.map((report, index) => `${index + 1}`).join(','), // Generate x values
            yValues: weeklyReports.map(report => report.cwRequestsCount) // Generate y values
        };
        const data2 = await pieReport.findOne({numid: 1});
        console.log(`${data2}`);
        res.render("statistics", {data, data2});
    } catch (error) {
        // Handle error
    }
});


app.get("/forgot_pass", (req, res) => {
    res.render("forgot_pass"); // Assuming you have a forgot_pass.hbs file in your views directory
});



app.post("/crudop", async(req, res)=>{
    try {
        res.render("crudop"); 

    } catch (error) {
        notifier.notify(`Something went wrong!!`);
    }
});
app.get("/login", (req, res) => {
    res.render("login"); // Assuming you have a forgot_pass.hbs file in your views directory
});


app.post("/approve/:srno", async(req, res)=>{
    try {
        const srnos = req.params.srno;
        const cwRequestss = await Cws.findOne({srno: srnos});
        console.log(`gbfhchjs`);
        console.log(`${cwRequestss}`);
        console.log(`${cwRequestss.proof}`);
        var proofs = cwRequestss.proof;
        res.render("approval_page",{srnorequest:cwRequestss, proofs});

    } catch (error) {
        notifier.notify(`Something went wrong!!`);
    }
});

app.post("/accept/:srno", async (req, res) => {
    try {
        const srno = req.params.srno;
        const action = req.body.action; // action is either 'approve' or 'reject'
        let hodEmail, deanEmail;
        const cwRequest = await Cws.findOne({ srno: srno });
        console.log(`${cwRequest.reviwedByDean}`);
        if (
            cwRequest.reviwedByCC === "pending" &&
            cwRequest.reviwedByHod === "pending" &&
            cwRequest.reviwedBYDean === "pending"
        ){
            console.log(`${cwRequest.reviewedByCC}`);
            const update = action === 'approve' ?  'accepted' : 'pending' ;

        // Update the document in the MongoDB collection
        const result = await Cws.updateOne({ srno: srno }, {$set:{reviwedByCC: update}});
        console.log('Update result:', result);
        const hod = await Hods.findOne({ department: cwRequest.department });
        hodEmail = hod.email;
        console.log(`hod Email: ${hodEmail}`);
        var mailOptions = {
            from: 'classsworks@gmail.com',
            to: hodEmail,
            subject: 'Requesting Classwork',
            html: `<h1>You have recieved a classwork request from <b>${cwRequest.studcrn}:${cwRequest.name}</b></h1>`, // html body
        };
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error);
            }else{
                console.log('Email Sent: ' + info.response);
            }
        });
        // Redirect back to the admin page
        const usercrn = await Class_Coordinators.findOne({crn:cwRequest.cccrn});
            ccrn = usercrn;
            const userInitial = usercrn.name.charAt(0);
            const cwRequests = await Cws.find({
                $and:[
                {currentcc: ccrn.name,},
                {reviwedByCC: 'pending'},
                {reviwedByHod: 'pending'},
                {reviwedBYDean: 'pending'},
                ]
            });
            if(usercrn){
                res.status(201).render("admin",{ccData: usercrn,ccRequests: cwRequests, ui: userInitial});  
        }
        notifier.notify("Approved");  // Replace '/admin' with the actual route to the admin page

        }
        else if(
            cwRequest.reviwedByCC === "accepted" &&
            cwRequest.reviwedByHod === "pending" &&
            cwRequest.reviwedBYDean === "pending"
        ){
            const update = action === 'approve' ?  'accepted' : 'pending' ;

        // Update the document in the MongoDB collection
        const result = await Cws.updateOne({ srno: srno }, {$set:{reviwedByHod: update}});
        console.log('Update result:', result);
        deanEmail = "rsthakur371123@kkwagh.edu.in";
        var mailOptions = {
            from: 'classsworks@gmail.com',
            to: deanEmail,
            subject: 'Requesting Classwork',
            html: `<h1>You have recieved a classwork request from <b>${cwRequest.studcrn}</b></h1>`
        };
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error);
            }else{
                console.log('Email Sent: ' + info.response);
            }
        });
        // Redirect back to the admin page
        notifier.notify("Approved"); // Replace '/admin' with the actual route to the admin page
        const usercrn = await Hods.findOne({department:cwRequest.department});
            hcrn = usercrn;
            const userInitial = usercrn.name.charAt(0);
            //const cwRequests = await Cws.find({department: hcrn.department});
            const cwRequests = await Cws.find({
                $and:[
                {department: hcrn.department},
                {reviwedByCC: 'accepted'},
                {reviwedByHod: 'pending'},
                {reviwedBYDean: 'pending'},
                ]
            });
            
            if(usercrn){
                res.status(201).render("hod",{hodData: usercrn,hodRequests: cwRequests, ui: userInitial});
            }
        }
        else if(
            cwRequest.reviwedByCC === "accepted" &&
            cwRequest.reviwedByHod === "accepted" &&
            cwRequest.reviwedBYDean === "pending"
        ){
            const update = action === 'approve' ?  'accepted' : 'pending' ;

        // Update the document in the MongoDB collection
        const result = await Cws.updateOne({ srno: srno }, {$set:{reviwedBYDean: update}});
        console.log('Update result:', result);
        // Redirect back to the admin page
        console.log(`${cwRequest.studemail}`);
        var mailOptions = {
            from: 'classsworks@gmail.com',
            to: cwRequest.studemail,
            subject: 'Classwork Grant',
            html: `<h1>Congratulations!!!Your class work request has been accepted for date <b>${cwRequest.dateofdeparture}</b></h1>`
        };
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error);
            }else{
                console.log('Email Sent: ' + info.response);
            }
        });
        notifier.notify("Approved");// Replace '/admin' with the actual route to the admin page
        const usercrn = await Deans.findOne({crn:3722113006});
            dcrn = usercrn;
            const userInitial = usercrn.name.charAt(0);
            const cwRequests = await Cws.find({
                $and:[
                {currentdean: dcrn.name},
                {reviwedByCC: 'accepted'},//3722113006 12345
                {reviwedByHod: 'accepted'},
                {reviwedBYDean: 'pending'},
                ]
            });
            
            if (action === 'approve') {
                const result = await pieReport.updateOne({
                    numid: 1
                }, {
                    $inc: {
                        allaccepted: 1
                    }
                });
                const result1 = await pieReport.updateOne({
                    numid: 1
                }, {
                    $inc: {
                        allpending: -1
                    }
                });
                console.log(`${result} ${result1}`);
                //await pieReport.updateOne({}, { $inc: { accepted: 1 } });
            }
            //const cwRequests = await Cws.find({reviwedByCC:"accepted",reviwedByHod:"accepted",reviwedByDean:"pending"});
            if(usercrn){
                res.status(201).render("dean",{deanData: usercrn, deanRequests:cwRequests, ui: userInitial});
            }
        }
        // Update the document in the MongoDB collection based on the action
        
    } catch (error) {
        console.error("Error updating review status:", error);
        notifier.notify(`Something went wrong!!`);
       
    }
});

app.post("/reject/:srno", async (req, res) => {

    try {
        const srno = req.params.srno;
        const action = req.body.action; // action is either 'approve' or 'reject'
        if (action === 'reject') {
            const result = await pieReport.updateOne({
                numid: 1
            }, {
                $inc: {
                    allrejected: 1
                }
            });
            const result1 = await pieReport.updateOne({
                numid: 1
            }, {
                $inc: {
                    allpending: -1
                }
            });
            console.log(`${result} ${result1}`);
        } 
        const cwRequest = await Cws.findOne({ srno: srno });
        console.log(`${cwRequest.reviwedBYDean}`);
        if (
            cwRequest.reviwedByCC === "pending" &&
            cwRequest.reviwedByHod === "pending" &&
            cwRequest.reviwedBYDean === "pending"
        ){
        console.log(`${cwRequest.reviwedByCC}`);
        // Update the document in the MongoDB collection based on the action
        const rejectnote = req.body.userNote;
        const update = action === 'reject' ?  'rejected' : 'pending' ;
        
        // Update the document in the MongoDB collection
        const result = await Cws.updateOne({ srno: srno }, {$set:{reviwedByCC: update}});
        console.log('Update result:', result);
        var mailOptions = {
            from: 'classsworks@gmail.com',
            to: cwRequest.studemail,
            subject: 'Classwork Rejected',
            html: `<h1>Sorry!!!Your class work request has been declined for date <b>${cwRequest.dateofdeparture}</b> <br/>Reason <b>${rejectnote}</b></h1>`
        };
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error);
            }else{
                console.log('Email Sent: ' + info.response);
            }
        });
        // Redirect back to the admin page
        notifier.notify("Rejected");
        const usercrn = await Class_Coordinators.findOne({crn:cwRequest.cccrn});
            ccrn = usercrn;
            const userInitial = usercrn.name.charAt(0);
            const cwRequests = await Cws.find({
                $and:[
                {currentcc: ccrn.name,},
                {reviwedByCC: 'pending'},
                {reviwedByHod: 'pending'},
                {reviwedBYDean: 'pending'},
                ]
            });
            if(usercrn){
                res.status(201).render("admin",{ccData: usercrn,ccRequests: cwRequests, ui: userInitial});  
        } // Replace '/admin' with the actual route to the admin page
        }
        else if(
            cwRequest.reviwedByCC === "accepted" &&
            cwRequest.reviwedByHod === "pending" &&
            cwRequest.reviwedBYDean === "pending"
        ){
            const rejectnote = req.body.userNote;
            const update = action === 'reject' ?  'rejected' : 'pending' ;

        // Update the document in the MongoDB collection
        const result = await Cws.updateOne({ srno: srno }, {$set:{reviwedByHod: update}});
        console.log('Update result:', result);
        //var note1 = window.prompt("Enter a note to reject application: ");
        // Redirect back to the admin page
        var mailOptions = {
            from: 'classsworks@gmail.com',
            to: cwRequest.studemail,
            subject: 'Classwork Rejected',
            html: `<h1>Sorry!!!Your class work request has been declined for date <b>${cwRequest.dateofdeparture}</b> <br/>Reason: <b>${rejectnote}</b></h1>`
        };
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error);
            }else{

                console.log('Email Sent: ' + info.response);
            }
        });
        notifier.notify("Rejected");// Replace '/admin' with the actual route to the admin page
        const usercrn = await Hods.findOne({department:cwRequest.department});
            hcrn = usercrn;
            const userInitial = usercrn.name.charAt(0);
            //const cwRequests = await Cws.find({department: hcrn.department});
            const cwRequests = await Cws.find({
                $and:[
                {department: hcrn.department},
                {reviwedByCC: 'accepted'},
                {reviwedByHod: 'pending'},
                {reviwedBYDean: 'pending'},
                ]
            });
            
            if(usercrn){
                res.status(201).render("hod",{hodData: usercrn,hodRequests: cwRequests, ui: userInitial});
            }
        }
        else if(
            cwRequest.reviwedByCC === "accepted" &&
            cwRequest.reviwedByHod === "accepted" &&
            cwRequest.reviwedBYDean === "pending"
        ){
            const rejectnote = req.body.userNote;
            const update = action === 'reject' ?  'rejected' : 'pending' ;

        // Update the document in the MongoDB collection
        const result = await Cws.updateOne({ srno: srno }, {$set:{reviwedBYDean: update}});
        console.log('Update result:', result);
         var mailOptions = {
            from: 'classsworks@gmail.com',
            to: cwRequest.studemail,
            subject: 'Classwork Rejected',
            html: `<h1>Sorry!!!Your class work request has been declined for date <b>${cwRequest.dateofdeparture}</b> <br/>Reason: <b>${rejectnote}</b></h1>`
        };
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error);
            }else{
                console.log('Email Sent: ' + info.response);
            }
        });

        // Redirect back to the admin page
        notifier.notify("Rejected");// Replace '/admin' with the actual route to the admin page
        const usercrn = await Deans.findOne({crn:3722113006});
            dcrn = usercrn;
            const userInitial = usercrn.name.charAt(0);
            const cwRequests = await Cws.find({
                $and:[
                {currentdean: dcrn.name},
                {reviwedByCC: 'accepted'},//3722113006 12345
                {reviwedByHod: 'accepted'},
                {reviwedBYDean: 'pending'},
                ]
            });
            //const cwRequests = await Cws.find({reviwedByCC:"accepted",reviwedByHod:"accepted",reviwedByDean:"pending"});
            if(usercrn){
                res.status(201).render("dean",{deanData: usercrn, deanRequests:cwRequests, ui: userInitial});
            }
        }
        // Update the document in the MongoDB collection based on the action
        
    } catch (error) {
        console.error("Error updating review status:", error);
        notifier.notify(`Something went wrong!!`);
        
    }
});


//login check
app.post("/login", async (req, res)=>{
    try{
        const userType = req.body.userType;
        const crn = req.body.crn;
        const pass = req.body.password;
        console.log(`${userType} ${crn} ${pass} `);
        if(userType=="admin"){
            const usercrn = await Deans.findOne({crn:crn});
            dcrn = usercrn;
            const userInitial = usercrn.name.charAt(0);
            const cwRequests = await Cws.find({
                $and:[
                {currentdean: dcrn.name},
                {reviwedByCC: 'accepted'},//3722113006 12345
                {reviwedByHod: 'accepted'},
                {reviwedBYDean: 'pending'},
                ]
            });
            //const cwRequests = await Cws.find({reviwedByCC:"accepted",reviwedByHod:"accepted",reviwedByDean:"pending"});
            if(usercrn){
            if(usercrn.password==pass){
                console.log(`${pass} ${usercrn.password}`)
                res.status(201).render("dean",{deanData: usercrn, deanRequests:cwRequests, ui: userInitial});
            }else{
                notifier.notify(`Invalid Credentials `);
            }}
        }
        else if(userType=="hod"){
            const usercrn = await Hods.findOne({crn:crn});
            hcrn = usercrn;
            const userInitial = usercrn.name.charAt(0);
            //const cwRequests = await Cws.find({department: hcrn.department});
            const cwRequests = await Cws.find({
                $and:[
                {department: hcrn.department},
                {reviwedByCC: 'accepted'},
                {reviwedByHod: 'pending'},
                {reviwedBYDean: 'pending'},
                ]
            });
            /*const filteredCwRequests = cwRequests.filter(request => {
                return cwRequests.reviwedByCC === "accepted" && 
                       cwRequests.reviwedByHod === "pending" && 
                       cwRequests.reviwedByDean === "pending";
            });*/
            //const cwRequests = await Cws.find({ $and: [ { department: hcrn.department}, {reviwedByCC:"accepted"}, {reviwedByHod:"pending"}, {reviwedByDean:"pending"} ] });
            if(usercrn){
            if(usercrn.password==pass){
                console.log(`${pass} ${usercrn.password} ${cwRequests}`)
                res.status(201).render("hod",{hodData: usercrn,hodRequests: cwRequests, ui: userInitial});
            }else{
                notifier.notify(`Invalid Credentials `);
            }
        }
        }
        else if(userType=="cc"){
            const usercrn = await Class_Coordinators.findOne({crn:crn});
            ccrn = usercrn;
            const userInitial = usercrn.name.charAt(0);
            const cwRequests = await Cws.find({
                $and:[
                {currentcc: ccrn.name,},
                {reviwedByCC: 'pending'},
                {reviwedByHod: 'pending'},
                {reviwedBYDean: 'pending'},
                ]
            });
            if(usercrn){
            if(usercrn.password==pass){
                console.log(`${pass} ${usercrn.password} ${cwRequests}`)
                res.status(201).render("admin",{ccData: usercrn,ccRequests: cwRequests, ui: userInitial});
            }else{
                notifier.notify(`Invalid Credentials `);
            }
        }
        }
        else if(userType=="student"){
            const usercrn = await Students.findOne({crn:crn});
            ucrn = usercrn;
            const userInitial = usercrn.name.charAt(0);
            console.log(`${usercrn} ${usercrn.password} ${usercrn.profilephoto}`)
            if(usercrn){
                if(usercrn.password==pass){
                    console.log(`${pass} ${usercrn.password} ${usercrn.profilephoto}`)
                    res.status(201).render("profilepage",{userData: usercrn, ui: userInitial});     
                }else{
                    notifier.notify(`Invalid Credentials `);
                }
            }
            
        }
        //const usercrn = await Students.findOne({crn:crn});
        
        //res.send(usercrn);
        //console.log(usercrn);
        //const userpass = await Students.findOne({password:pass});
        //res.render("profilepage");
        

    }catch(error){
        
       notifier.notify(`Invalid Credentials `);
        
    }
});

cron.schedule('0 0 * * 0', async () => {
    console.log('Running weekly cron job');
    try {
        // Calculate the start and end of the previous week
        const today = new Date();
        const startOfLastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - 6);
        const endOfLastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - 1);

        const numberOfDocuments = await Cws.find({
            createdAt: {
                $gte: startOfLastWeek,
                $lte: endOfLastWeek
            }
        }).countDocuments();

        console.log(numberOfDocuments);
        const newweeklyreport = new WeeklyReport({
            cwRequestsCount: numberOfDocuments, weekStartDate: startOfLastWeek, weekEndDate: endOfLastWeek
        });

        await newweeklyreport.save();
        // Insert the count into the weeklyreport collection
        //await WeeklyReport.insertOne({ numberOfDocuments, startDate: startOfLastWeek, endDate: endOfLastWeek });

        console.log('Weekly cron job executed successfully');
    } catch (error) {
        console.error('Error occurred:', error);
    }
    // Put your code to run after each week here
  }, {
    timezone: "Asia/Kolkata" // Specify your timezone here, e.g., "America/New_York"
  });


app.get("/application", (req, res) => {
    const startOfWeek = moment().startOf('week').toDate();
    console.log(`${startOfWeek}`)
    if(ucrn.NetAttendace >= 75){
        res.status(201).render("application",{userData: ucrn}); // Assuming you have a application.hbs file in your views directory
    }
    
});



app.get("/notif/:scrn", async (req, res) => { // Mark the function as async
    try {
        // Retrieve the necessary data from the cw_requests collection
        //const cwRequests = await Cws.find({ studcrn: ucrn.crn });
        const ccrn = req.params.scrn;
        const cwRequest1 = await Cws.findOne({ studcrn: ccrn }).sort({ createdAt: -1 }).limit(1);

          res.render('notif',{cwreq:cwRequest1});

    } catch (error) {
        console.error("Error submitting CW request:", error);
    }
});

const counterSchema={
    id:{
        type:String
    },
    seq:{
        type:Number
    }
}
const counterModel=new mongoose.model("counter", counterSchema);

app.post("/notif", multer.single('proof'), async (req, res) => { // Mark the function as async
    try {
        const departure = req.body.departure;
        console.log(`${departure}`);
        console.log(`${ucrn.crn} ${ucrn.CurrentCC} ${ucrn.email} `);
        const returned = req.body.returned;
        console.log(` ${returned} `);
        const reason = req.body.reason;
        console.log(`${reason} `);
        const proof = req.file.path.replace(/\\/g, '/');
        console.log(`${proof}`);
        const cc1 = await Class_Coordinators.findOne({ name: ucrn.CurrentCC });
        console.log(`${cc1.email}`);
        const cd = await counterModel.findOneAndUpdate(
            { id: "autoval" },
            { "$inc": { "seq": 1 } },
            { new: true }
        ).exec();

        let seqId;
        if (cd == null) {
            const newval = new counterModel({ id: "autoval", seq: 1 });
            await newval.save();
            seqId = 1;
        } else {
            seqId = cd.seq;
        }
        const cwRequest = new Cws({
            srno: seqId,
            roll: ucrn.Roll,
            name: ucrn.name,
            netattendance: ucrn.NetAttendace,
            cy: ucrn.class,
            sect:ucrn.div,
            currentdean:ucrn.CurrentDean,
            cccrn:ucrn.cccrn,
            department:ucrn.Department,
            currenthod:ucrn.CurrentHod,
            studcrn: ucrn.crn,
            currentcc: ucrn.CurrentCC,
            studemail: ucrn.email,
            dateofdeparture: departure,
            dateofreturn: returned,
            reason: reason,
            proof: proof,
            profileimage: ucrn.profilephoto,
            cemail: cc1.email
        });

        await cwRequest.save();
        const result = await pieReport.updateOne({
            numid: 1
        }, {
            $inc: {
                allpending: 1
            }
        });
        //const result = await pieReport.updateOne({}, { $inc: { pending: 1 } });

        console.log(`${result}`);
        //await pieReport.updateOne({}, { $inc: { pending: 1 } });
        // Retrieve the necessary data from the cw_requests collection
        const cwRequests = await Cws.find({ studcrn: ucrn.crn });
        const cwRequest1 = await Cws.findOne({ studcrn: ucrn.crn }).sort({ createdAt: -1 }).limit(1);
        const ccEmail = cc1.email;
        console.log(`${ccEmail}`);
        //console.log1(`${ccEmail}`);
        var mailOptions = {
            from: 'classsworks@gmail.com',
            to: ccEmail,
            subject: 'Requesting Classwork',
            html: `<h1>You have recieved a classwork request from <b>${ucrn.crn}${ucrn.name}<b><h1>`, // html body
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });

          res.render('notif',{cwreq:cwRequest1});
        /*var mailOptions = {
            from: 'classsworks@gmail.com',
            to: ccEmail,
            subject: 'Requesting Classwork',
            text: `You have recieved a classwork request from ${cwRequests.studcrn}`
        };
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error);
            }else{
                console.log('Email Sent: ' + info.response);
            }
        });*/
        // Pass the cwRequests data to the notif.hbs file for rendering
        /* const server = http.createServer((request, response) => {
            const auth = nodemailer.createTransport({
                service: "gmail",
                secure : true,
                port : 465,
                auth: {
                    user: "classsworks@gmail.com",
                    pass: "qbuv lqyd syoi zftr"
        
                }
            });
          const receiver = {
            from : "classsworks@gmail.com",
            to : ccEmail,
            subject : "Requesting Classwork",
            html: `<h1>You have recieved a classwork request from <b>${cwRequests.studcrn}<b><h1>`, // html body
        };
        
        auth.sendMail(receiver, (error, emailResponse) => {
            if(error)
            throw error;
            console.log("success!");
            response.end();
        });
        
        });
        
       if (process.env.START_SERVER === "true") {
            const PORT = process.env.PORT || 8088;
            server.listen(PORT, () => {
                console.log(`Server is listening on port ${PORT}`);
            });
        } else {
            console.log("Server not started. Use environment variable START_SERVER=true to start the server.");
        }
        
        // Export the server object for testing purposes
        module.exports = server;*/
        

    } catch (error) {
        console.error("Error submitting CW request:", error);
        res.status(500).send("Error submitting CW request");
    }
});
/*
$(document).ready(function(){
	var characterTemplate = $("#character-template").html();

	var compiledCharacterTemplate = Handlebars.compile(characterTemplate);

	$.ajax("./data/cast.json").done(function(cast) {
		$(".character-list-container").html(compiledCharacterTemplate(cast));
	});
});*/
app.listen(port, ()=>{
   /*MongoClient.connect("mongodb://0.0.0.0:27017/classworksystem",
        (err,result)=>{
            if(err) throw err
            database = result.db('classworksystem');
            console.log('Connect Success ');
        })*/
    console.log('server running ');
});

const pwdResetSchema = new mongoose.Schema({
    email: String,
    otp: String
});
const PwdReset = mongoose.model('PwdReset', pwdResetSchema, 'pwd_reset'); // Specify collection name

// Middleware to parse URL-encoded and JSON request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/send_otp', async (req, res) => {
    try {
        const email = req.body.email;
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP

        // Send the OTP via email
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: "classsworks@gmail.com",
                pass: "qbuv lqyd syoi zftr"
            }
        });

        let mailOptions = {
            from: 'classsworks@gmail.com',
            to: email,
            subject: 'Your OTP',
            text: `Your OTP is ${otp}`
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        // Save the OTP and email to the PwdReset collection
        const pwdReset = new PwdReset({ email: email, otp: otp.toString() });
        await pwdReset.save();

        res.status(200).send('OTP sent successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while trying to send the OTP');
    }
});
app.get('/otp_enter', (req, res) => {
    res.render('otp_enter');
});

app.get('/password_reenter', (req, res) => {
    res.render('password_reenter');
});

app.post('/verify_otp', async (req, res) => {
    try {
        const email = req.body.email;
        const otp = req.body.otp;

        // Retrieve the document with the provided email and OTP
        const pwdReset = await PwdReset.findOne({ email: email, otp: otp });

        if (pwdReset) {
            // If the document is found, delete it and redirect to the password reenter page
            await PwdReset.deleteOne({ _id: pwdReset._id });
            res.redirect('/password_reenter');
        } else {
            // If no document is found, redirect to the login page
            res.redirect('/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while trying to verify the OTP');
    }
});

app.post('/change_password', async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const confirmPassword = req.body.confirm_password;

        // Check if the password and confirm password fields match
        if (password !== confirmPassword) {
            return res.status(400).send('The password and confirm password fields do not match');
        }

        // Update the password for the document with the provided email in the Students collection
        const student_ = await student.findOneAndUpdate({ email: email }, { password: password }, { new: true });

        if (student_) {
            res.status(200).send('Password changed successfully');
        } else {
            res.status(404).send('No student found for the provided email');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while trying to change the password');
    }
});