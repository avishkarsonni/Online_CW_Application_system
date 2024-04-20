const handlebars = require("handlebars");
const express = require("express");
const path = require("path");
const hbs = require("hbs");
const multer = require("./middlewares/upload");
const mongoose = require("mongoose");
const notifier = require('node-notifier');


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

const db = require("./db/conn");
const Students = require("./models/students");
const Class_Coordinators = require("./models/class_coordinators");
const Deans = require("./models/deans");
const Hods = require("./models/hods");
const Cws = require("./models/cw_requests");
const { type } = require("os");
var ucrn, ccrn, hcrn, dcrn;
//var database;
app.use((req, res, next) => {
    req.db = db;
    next();
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


app.get("/forgot_pass", (req, res) => {
    res.render("forgot_pass"); // Assuming you have a forgot_pass.hbs file in your views directory
});

app.get("/crudop", (req, res) => {
    res.render("crudop"); 
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
            const cwRequests = await Cws.find({
                $and:[
                {currentdean: dcrn.name},
                {reviwedByCC: 'accepted'},//3722113006 12345
                {reviwedByHod: 'accepted'},
                {reviwedBYDean: 'pending'},
                ]
            });
            //const cwRequests = await Cws.find({reviwedByCC:"accepted",reviwedByHod:"accepted",reviwedByDean:"pending"});
            if(usercrn.password==pass){
                console.log(`${pass} ${usercrn.password}`)
                res.status(201).render("dean",{deanData: usercrn, deanRequests:cwRequests});
            }
        }
        else if(userType=="hod"){
            const usercrn = await Hods.findOne({crn:crn});
            hcrn = usercrn;
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
            if(usercrn.password==pass){
                console.log(`${pass} ${usercrn.password} ${cwRequests}`)
                res.status(201).render("hod",{hodData: usercrn,hodRequests: cwRequests});
            }
        }
        else if(userType=="cc"){
            const usercrn = await Class_Coordinators.findOne({crn:crn});
            ccrn = usercrn;
            const cwRequests = await Cws.find({
                $and:[
                {currentcc: ccrn.name,},
                {reviwedByCC: 'pending'},
                {reviwedByHod: 'pending'},
                {reviwedBYDean: 'pending'},
                ]
            });
            if(usercrn.password==pass){
                console.log(`${pass} ${usercrn.password} ${cwRequests}`)
                res.status(201).render("admin",{ccData: usercrn,ccRequests: cwRequests});
            }
        }
        else if(userType=="student"){
            const usercrn = await Students.findOne({crn:crn});
            ucrn = usercrn;
            if(usercrn.password==pass){
                console.log(`${pass} ${usercrn.password} ${usercrn.profilephoto}`)
                res.status(201).render("profilepage",{userData: usercrn});     
            }
        }
        //const usercrn = await Students.findOne({crn:crn});
        
        //res.send(usercrn);
        //console.log(usercrn);
        //const userpass = await Students.findOne({password:pass});
        //res.render("profilepage");
        

    }catch(error){
        
       res.status(400).send(`Invalid Credentials ${error}`);
        
    }
});


/*app.post("/login",async(req, res)=>{
    try{
        const userType = req.body.userType;
        const crn = req.body.crn;
        const pass = req.body.password;

        console.log(`${userType} and ${crn} and ${pass}`);
        let collectionName;
        switch (userType) {
        case "admin":
            collectionName = "deans";
            break;
        case "hod":
            collectionName = "hods";
            break;
        case "cc":
            collectionName = "class_coordinators";
            break;
        case "student":
            collectionName = "students";
            break;
        default:
            return res.status(400).send("Invalid user type");
        }
        
         // Access the MongoDB collection based on the user type
         console.log(`${collectionName}`);
         console.log(`${db} hello`);
         //const collection = req.db.collection(collectionName);
         
         //console.log(`${req.db}`);
         //console.log(`${req.db.collection(collectionName)}`);
         // Find user in the appropriate collection
         const user = await collection.findOne({ crn: crn });

         if (!user) {
            return res.status(400).send("User not found");
        } else {
            if (user.password !== pass) {
                return res.status(400).send("Invalid password");
            } else {
                switch (userType) {
                    case "admin":
                        res.status(201).render("dean");
                        break;
                    case "hod":
                        res.status(201).render("hod");
                        break;
                    case "cc":
                        res.status(201).render("admin");
                        break;
                    case "student":
                        res.status(201).render("profilepage");
                        break;
                }
            }
        }

    }catch(error){
        console.log(error);
        res.status(400).send("Invalid Credentials")
    }
})*/

app.get("/application", (req, res) => {
    if(ucrn.NetAttendace >= 75){
        res.status(201).render("application",{userData: ucrn}); // Assuming you have a application.hbs file in your views directory
    }
    
});

app.get("/notif", (req, res) => {
    res.status(201).render("notif",{userData: ucrn}); // Assuming you have a application.hbs file in your views directory
    
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
        const proof = req.file.path;
        console.log(`${proof}`);

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
            proof: proof
        });

        await cwRequest.save();

        // Retrieve the necessary data from the cw_requests collection
        const cwRequests = await Cws.find({ studcrn: ucrn.crn });

        // Pass the cwRequests data to the notif.hbs file for rendering

        

        res.render("notif", {
            cwRequests
        });

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
})

