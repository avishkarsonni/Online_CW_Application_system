const path = require("path");
const multer = require("multer");

var storage = multer.diskStorage({
    destination: function(req, file, cb){
        return cb(null, './public/uploads')
    },
    filename: function(req, file, cb){
        let ext = path.extname(file.originalname);
        return cb(null, Date.now() + ext);
    }
})

var upload = multer({
    storage: storage,
    fileFilter: function(req, file, callback){
        if(file.mimetype == "application/pdf" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || file.mimetype == "image/png")
        {
            callback(null, true)
        }else{
            console.log('only pdf, png, jpeg, jpg files supported!!')
        }
    },
    limits:{
        fileSize: 1024 * 1024 * 200
    }
})

module.exports = upload;