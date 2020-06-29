var mongoose = require("mongoose");
//connecting of mongoose on local server
mongoose.connect('mongodb://localhost:27017/userDetails',{useNewUrlParser: true, useUnifiedTopology: true});
var passportLocalMongoose = require("passport-local-mongoose");
//making of schema
var schema = new mongoose.Schema({
    username:{
      unique:true,
      type:String,
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
    fullname:{
      type:String,
      required:true
    },
    donationdetails:[{phoneno: Number, amount: Number, needyname: String, helptype: String, category: String, date: String, ngoname: String, ngoph: Number}],
    token:String, // email verification
    active:{
      type:Boolean,
      default:false
    },
    isUser:{
      type:Boolean,
      default:true
    },

});
//plugging of local-passport-mongoose features into user-schema
schema.plugin(passportLocalMongoose);
//model formation
var model = mongoose.model("User",schema);
module.exports = model;
