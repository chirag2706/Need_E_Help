var mongoose = require("mongoose");
//connecting of mongoose on local server
mongoose.connect('mongodb://localhost:27017/userDetails',{useNewUrlParser: true, useUnifiedTopology: true});
var passportLocalMongoose = require("passport-local-mongoose");
//making of schema
var schema = new mongoose.Schema({
    phoneno:{
      type:Number,
      unique:true,
      required:true
    },
    regnumber:{
      type:Number,
      unique:true,
      required:true
    },
    email:{
      unique:true,
      type:String,
      required:true
    },
    password:{
      type:String,
      required:true
    },
    username:{
      type:String,
      required:true,
      unique:true
    },
    token:String, // email verification
    active:{
      type:Boolean,
      default:false
    },
    isUser:{
      type:Boolean,
      default:false
    },
    aboutngo:{
      type:String,
      default:"",
      required:true
    },
    locationofwork:{
      type:String,
      required:true
    },
    ngoleadership:{
      type:String,
      required:true
    },
    needyPeople:[{phoneno:Number}]


});
//plugging of local-passport-mongoose features into user-schema
schema.plugin(passportLocalMongoose);
//model formation
var model = mongoose.model("Ngo",schema);
module.exports = model;
