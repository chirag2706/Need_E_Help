var mongoose = require("mongoose");
//connecting of mongoose on local server
mongoose.connect('mongodb://localhost:27017/userDetails',{useNewUrlParser: true, useUnifiedTopology: true});
//making of schema
var schema = new mongoose.Schema({
    name:{
      type:String,
      required:true
    },
    Intro:{
      type:String,
      required:true
    },
    Place:{
      type:String,
      required:true
    },
    phoneno:{
      type:String,
      required:true,
      unique:true
    },
    gender:{
      type:String,
      required:true
    },
    category:{
      type:String,
      required:true
    },
    HelpType:{
      type:String,
      default:true
    },
    goal:{
      type:Number,
      required:true
    },
    aboutneedy:{
      type:String,
      required:true
    },
    amount:{
      type:Number,
      required:false
    },
    regno:{
      type:Number,
      required:true
    },
    numofsponsors:{
      type:Number,
      required:false
    },
    sponsors:[{user:String}]
});
//model formation
var model = mongoose.model("NeedyPeople",schema);
module.exports = model;
