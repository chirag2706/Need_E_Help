const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path  = require('path');
const app = express();
const ejs = require('ejs');
const randomstring = require('randomstring');
const bcryptNodejs = require('bcrypt-nodejs');
var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var passport = require("passport");
var passport1 = require("passport");
var passportLocal = require("passport-local").Strategy;
var session = require("express-session");
var cookieParser = require("cookie-parser");
var methodOverride = require("method-override");
var flash = require("connect-flash");
var nodemailer = require("nodemailer");
var localStorage = require('local-storage');
var multer = require('multer');
var gridStorage = require('multer-gridfs-storage');
var gridfsStream = require('gridfs-stream');
var crypto = require('crypto-js');

/*
  gridfs logic corrected totall
*/

//simulating sponsorship programme
//30sec = 1 month

//OLD FUNCTION timeout


// setTimeout(updateSponsor,30000);
//
// function updateSponsor() {
//   //{numofsponsors: {$gt: 0}}
//   console.log("NEW MONTH!!");
//   Needy.find({numofsponsors: {$gt: 0}}, function(err, result) {
//     if(err) throw err;
//     if(result) {
//       result.forEach(function (curneedy) {
//         if(curneedy.goal > curneedy.amount) {
//         curneedy.amount = Number(curneedy.amount) + Number(Number(curneedy.goal)/10 * Number(curneedy.numofsponsors));
//         curneedy.sponsors.forEach(function (curuser) {
//           User.findOne({username:curuser.user}, function(err1, result1) {
//             if(err1) throw err1;
//             if(result1) {
//               console.log(" donated to "+ curneedy);
//               result1.donationdetails.push({phoneno:curneedy.phoneno, amount: curneedy.goal/10, needyname: curneedy.name, helptype: curneedy.HelpType, category: curneedy.category});
//               result1.save();
//             }
//             else {
//               console.log("No user found :/");
//             }
//           });
//         });
//         curneedy.save();
//       }
//       });
//     }
//   });
//   setTimeout(updateSponsor,30000);
// }

setTimeout(updateSponsor,30000);

function updateSponsor() {
  //{numofsponsors: {$gt: 0}}
  console.log("NEW MONTH!!");
  Needy.find({numofsponsors: {$gt: 0}}, function(err, result) {
    if(err) throw err;
    if(result) {
      result.forEach(function (curneedy) {
        if(curneedy.goal > curneedy.amount) {
        curneedy.amount = Number(curneedy.amount) + Number(Number(curneedy.goal)/10 * Number(curneedy.numofsponsors));
        curneedy.save();
        curneedy.sponsors.forEach(function (curuser) {
          User.findOne({username:curuser.user}, function(err1, result1) {
            if(err1) throw err1;
            if(result1) {
              console.log(" donated to "+ curneedy);
              var d = new Date();
              var curdate = ""+d.getDate()+"-"+d.getMonth()+"-"+d.getFullYear();
              Ngo.findOne({regnumber: curneedy.regno}, function(err2, result2) {
                if(err2) throw err2;
                if(result2) {
                  result1.donationdetails.push({phoneno:curneedy.phoneno, amount: curneedy.goal/10, needyname: curneedy.name, helptype: curneedy.HelpType, category: curneedy.category, date: curdate, ngoname: result2.username, ngoph: result2.phoneno});
                  result1.save();
                }
              });
            }
            else {
              console.log("No user found :/");
            }
          });
        });
        curneedy.save();
      }
      });
    }
  });
  setTimeout(updateSponsor,30000);
}

var forgotpassworduser;

//setting up nodemailer
//https://myaccount.google.com/lesssecureapps visit this link and turn on the feature
//personal username and password of gmail account have not been added here but all the functions
//have been tested
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '',
    pass: ''
  }
});


mongoose.connect('mongodb://localhost:27017/userDetails',{useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex",true);
const conn=mongoose.connection;

//init gridfsStream
var gfs;

conn.once('open',()=>{

  gfs = gridfsStream(conn.db,mongoose.mongo);
  gfs.collection('fs');

})



app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const User = require('./views/models/users.js');
const Ngo = require('./views/models/ngos.js');
const Needy = require('./views/models/needypeoples.js');
app.use(cors());



app.use(cookieParser("secret"));
var expiryDate = new Date(Date.now()+100000);
//configuration of passport
app.use(session({
    secret: "cookies",
    resave: false,
    saveUninitialized: false,
    expires:expiryDate
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//app will use this middleware every time whenever app will get refresh or start
app.use(function(req,res,next){
    // res.locals.name = req.user.username ;
    res.locals.successMessage = req.flash("success");
    res.locals.errorMessage = req.flash("error");
    res.locals.loadingMessage = req.flash("loading");
    res.locals.user = req.flash('userLogin');

    // console.log(res.locals);
    next();
});


//create storage engine
var storage = new gridStorage({
  url: 'mongodb://localhost:27017/userDetails',
  options: {useUnifiedTopology: true,useCreateIndex:true},
  file: (req, file) => {

    return new Promise((resolve, reject) => {

          var randString = randomstring.generate();
          const filename = randString+path.extname(file.originalname);
          console.log("filename is");
          console.log(filename);

          const fileInfo = {
            filename: filename,
            bucketName: 'fs',
            metadata:JSON.parse(localStorage.get("cat"))
          };
          resolve(fileInfo);

        })

  }
});
const upload = multer({ storage:storage });

storage.on('connection', (db) => {
  // Db is the database instance
  console.log("image storing database is ready to use");
});

storage.on('connectionFailed', (err) => {
  // err is the error received from MongoDb
  console.log("Error in storing images in mongodb")
  console.log(err);
});



app.get('/', function(req, res){
  console.log("inside /");

  console.log(JSON.parse(localStorage.get("user")));
  res.render("home",{user:JSON.parse(localStorage.get("user"))});
});

app.get('/userLogin',function(req,res){
  if (JSON.parse(localStorage.get("user"))!==null){
    req.flash("error","That action is not allowed");
    res.redirect('/');
    return;
  }
  res.render("user_login",{user:undefined});
});

app.get('/myProfile',function(req,res){
    res.render("myprofile",{user:JSON.parse(localStorage.get("user"))})
})


app.get('/userSignup',function(req,res){
  if (JSON.parse(localStorage.get("user"))!==null){
    req.flash("error","That action is not allowed");
    res.redirect('/');
    return ;
  }
  res.render("user_signup",{user:undefined});
});

app.get('/SignupOption',function(req,res){
  if (JSON.parse(localStorage.get("user"))!==null){
    req.flash("error","That action is not allowed");
    res.redirect('/');
    return ;
  }
  res.render("SignupOption",{user:undefined})
});

app.get('/LoginOption',function(req,res){
  if (JSON.parse(localStorage.get("user"))!==null){
    req.flash("error","That action is not allowed");
    res.redirect('/');
    return ;
  }
  res.render("LoginOption",{user:undefined})
});

app.get('/userLogin/forgotPassword', function(req, res){
  if (JSON.parse(localStorage.get("user"))!==null){
    req.flash("error","That action is not allowed");
    res.redirect('/');
    return ;
  }
  res.render("forgot_password",{user:undefined});
});

app.get('/contact', function(req, res){

  res.render("contact",{user:JSON.parse(localStorage.get("user"))});
});

app.get('/category_options', function(req, res){

  res.render("category_options",{user:JSON.parse(localStorage.get("user"))});
});

app.get('/about', function(req, res){
  res.render("about",{user:JSON.parse(localStorage.get("user"))})
});

app.get('/ngo-registration', function(req, res){
  res.render("ngo-registration",{user:JSON.parse(localStorage.get("user"))})
});

app.get('/ngo-login',function(req,res){
  res.render("ngo-login",{user:JSON.parse(localStorage.get("user"))})
})

app.get("ngoProfile",function(req,res){
  res.render("ngoProfile",{user:JSON.parse(localStorage.get("user"))})
})

app.get('/needy_registration', function(req, res){
  res.render("needy_registration",{user:JSON.parse(localStorage.get("user"))});
});

app.get('/verify', function(req, res) {
  if (JSON.parse(localStorage.get("user"))!==null){
    req.flash("error","That action is not allowed");
    res.redirect('/');
    return ;
  }
  res.render("verify",{user:undefined});
});

app.get('/myDonation', function(req, res) {
  const usrnm = req.query.usr;
  var donationdetailsarray;
  User.findOne({'username':usrnm}, function(err, result) {
    if(err) throw err;
    if(result) {
      donationdetailsarray = result.donationdetails;
      if(donationdetailsarray.length > 0)
        res.render("myDonation",{user:JSON.parse(localStorage.get("user")), data:donationdetailsarray});
      else
        res.render("myDonation",{user:JSON.parse(localStorage.get("user")), data:"NONE"});
    }
  });
});


app.get('/verifyNgo', function(req, res) {
  if (JSON.parse(localStorage.get("user"))!==null){
    req.flash("error","That action is not allowed");
    res.redirect('/');
    return ;
  }
  res.render("verifyNgo",{user:undefined});
});

app.get('/changepassword', function(req, res) {
  if (JSON.parse(localStorage.get("user"))!==null){
    req.flash("error","That action is not allowed");
    res.redirect('/');
    return ;
  }
  console.log(forgotpassworduser);
  res.render("changepassword",{user:undefined});
});

//Donation categories

app.get("/image/:filename",(req,res)=>{
  gfs.files.findOne({filename:req.params.filename},(err,file)=>{
    //assuming image will always be png or jpeg as during needy form only these two types of images are accepted
    var readStream = gfs.createReadStream(file.filename);
    readStream.pipe(res);
  })
})

app.get('/education', function(req, res) {
  Needy.find({'category':"Education"}, function(err, result) {
    console.log(result);
    if(err) throw err;
    if(result) {
      // i am thinking that if result exists then image also exists
      console.log("data found"+result);
      gfs.files.find().toArray((err,files)=>{
        console.log("files is:");


        res.render("donationlist", {user:JSON.parse(localStorage.get("user")), category:"Education", data: result,files:files});
      })

    }
    else {
      console.log("Empty");
      res.render("donationlist", {user:JSON.parse(localStorage.get("user")), category:"Education"});
    }
  });
});

app.get('/health', function(req, res) {
  Needy.find({'category':"Health"}, function(err, result) {
    if(err) throw err;
    if(result) {
      gfs.files.find().toArray((err,files)=>{
        console.log("files is:");
        console.log(files);

        res.render("donationlist", {user:JSON.parse(localStorage.get("user")), category:"Health", data: result,files:files});
      })
    }
    else {
      console.log("Empty");
      res.render("donationlist", {user:JSON.parse(localStorage.get("user")), category:"Health"});
    }
  });
});

app.get('/women', function(req, res) {
  Needy.find({'category':"Women"}, function(err, result) {
    if(err) throw err;
    if(result) {
      console.log("data found"+result);
      gfs.files.find().toArray((err,files)=>{
        console.log("files is:");
        console.log(files);

        res.render("donationlist", {user:JSON.parse(localStorage.get("user")), category:"Women", data: result,files:files});
      })
    }
    else {
      console.log("Empty");
      res.render("donationlist", {user:JSON.parse(localStorage.get("user")), category:"Women"});
    }
  });
});

// app.get('/women', function(req, res) {
//   Needy.find({'category':"Women"}, function(err, result) {
//     if(err) throw err;
//     if(result) {
//       console.log("data found"+result);
//       res.render("donationlist", {user:JSON.parse(localStorage.get("user")), category:"Women", data: result});
//     }
//     else {
//       console.log("Empty");
//       res.render("donationlist", {user:JSON.parse(localStorage.get("user")), category:"Women"});
//     }
//   });
// });

app.get('/cancercare', function(req, res) {
  Needy.find({'category':"Cancer Care"}, function(err, result) {
    if(err) throw err;
    if(result) {
      console.log("data found:");
      // console.log(result[0].gender);
      // console.log(result);
      gfs.files.find().toArray((err,files)=>{
        console.log("files is:");
        console.log(files);

        res.render("donationlist", {user:JSON.parse(localStorage.get("user")), category:"Cancer Care", data: result,files:files});
      })
    }
    else {
      console.log("Empty");
      res.render("donationlist", {user:JSON.parse(localStorage.get("user")), category:"Cancer Care"});
    }
  });
});

app.get('/children', function(req, res) {
  Needy.find({'category':"Children"}, function(err, result) {
    if(err) throw err;
    if(result) {
      console.log("data found"+result);
      gfs.files.find().toArray((err,files)=>{
        console.log("files is:");
        console.log(files);

        res.render("donationlist", {user:JSON.parse(localStorage.get("user")), category:"Children", data: result,files:files});
      })
    }
    else {
      console.log("Empty");
      res.render("donationlist", {user:JSON.parse(localStorage.get("user")), category:"Children"});
    }
  });
});

app.get('/differentlyabled', function(req, res) {
  Needy.find({'category':"Differently Abled"}, function(err, result) {
    if(err) throw err;
    if(result) {
      console.log("data found"+result);
      gfs.files.find().toArray((err,files)=>{
        console.log("files is:");
        console.log(files);

        res.render("donationlist", {user:JSON.parse(localStorage.get("user")), category:"Differently Abled", data: result,files:files});
      })
    }
    else {
      console.log("Empty");
      res.render("donationlist", {user:JSON.parse(localStorage.get("user")), category:"Differently Abled"});
    }
  });
});
// app.get('/needy', function(req, res) {
//   const phoneno = req.query.phn;
//   Needy.findOne({'phoneno':phoneno}, function(err, result) {
//     if(err) throw err;
//     if(result) {
//       Ngo.findOne({regnumber: result.regno}, function(err1,result1) {
//         if(err1) throw err1;
//         if(result1) {
//           res.render("needyinfo",{user:JSON.parse(localStorage.get("user")), data: result, ngodata: result1});
//         }
//       });
//     }
//     else {
//       req.flash("error", "Massive error");
//       res.redirect("/");
//     }
//   });
// });


app.get('/needy', function(req, res) {
  const phoneno = req.query.phn;
  Needy.findOne({'phoneno':phoneno}, function(err, result) {
    // console.log("ll");
    if(err) throw err;
    if(result)
     {
            Ngo.findOne({regnumber: result.regno}, function(err1,result1) {
            if(err1) throw err1;
            if(result1)
            {
                gfs.files.find().toArray((err,files)=>{
                res.render("needyinfo",{user:JSON.parse(localStorage.get("user")),phoneNo:phoneno,data: result,files:files, ngodata: result1});
                // res.render("needyinfo",{user:JSON.parse(localStorage.get("user")), data: result, ngodata: result1});
            });
          }
      });
    }
    else {
      req.flash("error", "Massive error");
      res.redirect("/");
    }


  });
});

//OLD FUNCTION
// app.post('/donate', function(req,res) {
//   const username = req.query.usr; //to locate user who donated
//   const phoneno = req.query.phn; //to locate needy
//   User.findOne({username:username}, function(err, result) {
//     if(err) return err;
//     if(result) {
//       Needy.findOne({phoneno:phoneno}, function(err1, result1) {
//         if(err1) return err1;
//         if(result1) {
//           result1.amount = Number(result1.amount)+Number(req.body.donation);
//           result1.save();
//           result.donationdetails.push({phoneno:phoneno, amount: req.body.donation, needyname: result1.name, helptype: result1.HelpType, category: result1.category});
//           result.save();
//           res.render("donated",{user:JSON.parse(localStorage.get("user")), type:"Donation"});
//         }
//       });
//     }
//   });
// });

//NEW function
app.post('/donate', function(req,res) {
  const username = req.query.usr; //to locate user who donated
  const phoneno = req.query.phn; //to locate needy
  User.findOne({username:username}, function(err, result) {
    if(err) return err;
    if(result) {
      Needy.findOne({phoneno:phoneno}, function(err1, result1) {
        if(err1) return err1;
        if(result1) {
          result1.amount = Number(result1.amount)+Number(req.body.donation);
          result1.save();
          var d = new Date();
          var curdate = ""+d.getDate()+"-"+d.getMonth()+"-"+d.getFullYear();
          Ngo.findOne({regnumber: result1.regno}, function(err2, result2) {
            if(err2) throw err2;
            if(result2) {
              result.donationdetails.push({phoneno:phoneno, amount: req.body.donation, needyname: result1.name, helptype: result1.HelpType, category: result1.category, date: curdate, ngoname: result2.username, ngoph: result2.phoneno});
              result.save();
            }
          });

          res.render("donated",{user:JSON.parse(localStorage.get("user")), type:"Donation"});
        }
      });
    }
  });
});

app.post('/sponsor', function(req,res) {
  const username = req.query.usr; //to locate user who donated
  const phoneno = req.query.phn; //to locate needy

  User.findOne({username:username}, function(err, result) {
    if(err) return err;
    if(result) {
      Needy.findOne({phoneno:phoneno}, function(err1, result1) {
        if(err1) return err1;
        if(result1) {
          result1.numofsponsors = Number(result1.numofsponsors) + 1;
          result1.sponsors.push({user:username});
          result1.save();
          res.render("donated",{user:JSON.parse(localStorage.get("user")), type:"Sponsorship"});
        }
      });
    }
  });

});

app.get('/createImage',(req,res)=>{
  if (JSON.parse(localStorage.get("user"))===null||JSON.parse(localStorage.get("user"))===undefined){
    req.flash("error","That action is not allowed");
    res.redirect('/');
    return ;
  }
  if (localStorage.get("show")!== true||localStorage.get("show")===null||localStorage.get("show")===undefined){
    req.flash("error","That action is not allowed");
    res.redirect('/');
    return ;
  }

  res.render("image.ejs",{user:JSON.parse(localStorage.get("user"))});
})


app.post("/createImage",upload.single('file'),(req,res)=>{

  if (localStorage.get("show")!== true||localStorage.get("show")===null||localStorage.get("show")===undefined){
    req.flash("error","That action is not allowed");
    res.redirect('/');
    return ;
  }
  if (JSON.parse(localStorage.get("user"))===null||JSON.parse(localStorage.get("user"))===undefined){
    req.flash("error","That action is not allowed");
    res.redirect('/');
    return ;
  }
  localStorage.set('show',false);
  localStorage.set("cat",null);
  req.flash("success", "Needy registered successfully");
  res.redirect('/');
})

app.post('/needy_registration',(req,res)=> {
  console.log("needy registration is:");
  console.log(req.body);

  var cat = req.body;
  localStorage.set('cat',JSON.stringify(cat))
  localStorage.set("show",true);
  // req.file.cat = req.body.category;
  var photos = {
    file:req.file
  }

  console.log("photos is:");
  console.log(photos);
  console.log("upload is: ");
  console.log(storage);

  // console.log(photos);
  // console.log(storage);
  const name = req.body.NameofPerson;
  const Intro = req.body.Intro;
  const aboutneedy = req.body.aboutneedy
  const Place = req.body.Place;
  const phoneno = req.body.Phone;
  const gender = req.body.Gender;
  const category = req.body.category;
  const HelpType = req.body.HelpType;
  const goal = req.body.Goal;
  const regno = req.body.reg_no;
  const newNeedy = new Needy({
    name: name,
    phoneno: phoneno,
    gender: gender,
    category: category,
    HelpType: HelpType,
    goal: goal,
    regno: regno,
    Intro: Intro,
    Place: Place,
    aboutneedy: aboutneedy,
  });
  newNeedy.amount = 0;
  newNeedy.numofsponsors = 0;
  Ngo.findOne({regnumber: regno}, function(err, result) {
    if(err) throw err;
    if(result) {
      // console.log("Ngo Found : "+result);
      result.needyPeople.push({phoneno: phoneno});
      result.save();
      newNeedy.save(function(err) {
        if(err) {
          req.flash("error", "Error connecting to database");
          res.redirect("/");
          console.log(err);
          return handleError(err);
        }
        console.log("file uploading");

        req.flash("success", "Needy registered successfully");
        res.redirect("/createImage");
      });
    }
    else {
      req.flash("error", "Wrong registration number");
      res.redirect("/");
    }
  });
});

app.post('/changepassword', function(req, res) {
  const password = req.body.password;
  const password2 = req.body.password2;
  console.log("password="+password+" password2="+password2);
  if(password !== password2) {
    console.log("passwords don't match");
    req.flash("error","Passwords don't match");
    res.redirect('/');
  }
  else {
    //change password in forgotpassworduser using bcrypt
    bcryptNodejs.hash(password, null, null, (err, hash)=> {
      if(err) {
        console.log(err);
        console.log("encryption falied");
        req.flash("error","Encryption Failed");
        res.redirect('/');
      }
      else {
        console.log("password changed");
        forgotpassworduser.password = hash;
        forgotpassworduser.save();
        req.flash("success", "Password successfully changed");
        res.redirect('/');
      }
    });
  }
});

app.post('/verify', function(req, res) {
  const token = req.body.token;
  console.log(token);
  User.findOne({'token':token}, function(err, result) {
    if(err) throw err;
    if(result) {
      result.active = true;
      result.save();
      console.log("Verified!!");
      req.flash("success", "Successfully activated account, now you may sign in");
      res.redirect("/");
    }
    else {
      console.log("No user found with that token");
      req.flash("error", "No user found with that token");
      res.redirect("/");
    }
  });
});

app.post('/verifyNgo', function(req, res) {
  const token = req.body.token;
  console.log(token);
  Ngo.findOne({'token':token}, function(err, result) {
    if(err) throw err;
    if(result) {
      result.active = true;
      result.save();
      console.log("Verified!!");
      req.flash("success", "Successfully activated account, now you may sign in");
      res.redirect("/");
    }
    else {
      console.log("No NGO found with that token");
      req.flash("error", "No NGO found with that token");
      res.redirect("/");
    }
  });
});

app.post('/userLogin/forgotPassword', function(req, res){
  const email = req.body.email;
  User.findOne({'email':email}, function(err, result) {
    if(result) {
      forgotpassworduser = result;
      console.log(email);
      var mailOptions = {
        from: 'gcgcgc926@gmail.com',
        to: ''+email,
        subject: 'Forgot your password?',
        html: `<h1>Click on the link given below to change password</h1>
               <br><br> <a href="http://localhost:3000/changepassword">Change password</a>`
      };
      transporter.sendMail(mailOptions, function(error, info) {
        if(error) console.log(error);
        else {
          console.log("email sent "+ info.response);
          req.flash("success", "Password recovery email sent!");
          res.redirect("/");
        }
      });
    }
    else {
      console.log("No user found with that email");
      req.flash("error","No such user found");
      res.redirect('/userLogin');
    }
    });
});

app.post('/userSignupPost',function(req,res){
  //req.body
  console.log(req.body);

  const fullname = req.body.fullname;
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const confirmpassword = req.body.confirmpassword;
  const token = randomstring.generate();
  var newUser;
  if (password != confirmpassword){

    console.log("Password not matched");
    req.flash('error',"Password not matched");
    res.redirect('/userSignup');

    return;
  }




  User.find({email:email},function(err,allUsers){
    if (err){
      console.log(err);
    }else{
      if (allUsers.length == 0){
        //we can create a new User
        //use bcrypt

          newUser = new User({
            fullname:fullname,
            username:username,
            email:email,
            password:password,
            token:token //email verification
          });


        bcryptNodejs.hash(req.body.password, null, null, (err, hash)=> {
            if (err){
                console.log(err);
                req.flash("error",err.message);
            }else{

                newUser.password = hash;
                console.log("Hash: ",hash);
                User.register(newUser,req.body.password,(err,user)=>{
                    if (err){
                        // console.log(err.message);
                        req.flash("error",err.message);
                        // user.g = 0;
                        res.redirect("back");
                    }else{
                        passport.authenticate("local",{ failureRedirect: 'back',failureFlash:true })(req,res,function(){
                            // user.g = 1
                            var mailOptions = {
                              from: 'gcgcgc926@gmail.com',
                              to: ''+(newUser.email),
                              subject: 'Confirmation email for Need E-Help',
                              html: `<h1>Thanks for Registering to Need E-Help</h1>
                                     <br><br>Your secret token is <b>`+newUser.token+`<b>
                                     <br><br> <a href="http://localhost:3000/verify">Click on the following link to verify email</a>`
                            };
                            transporter.sendMail(mailOptions, function(error, info) {
                              if(error) console.log(error);
                              else {
                                console.log("email sent "+ info.response);
                              }
                            });
                            req.flash("success","An email has been sent for activiation");
                            res.redirect("/");

                        });
                        // console.log('registeration has been done  successfully');
                        // res.redirect('/');
                  }
              });
            }

        });


      }else{
        req.flash('error',"Email-Id already exists");
        res.redirect('back');

      }
    }
  })
});

// Login

app.post('/userLoginPost',function(req,res){
  console.log(req.body);

  /*
  { username: '18103021',
    password: 'Chaitanya@1',
  }
  */

  const username = req.body.username;
  const password = req.body.password;


    User.find({username:username},function(err,newuser){
        if (newuser.length>0){
          var result = bcryptNodejs.compareSync(password,newuser[0].password);
          if (result == true){
            if(newuser[0].active == false) {
              //flash account not yet active error
              req.flash("error","Account not yet activated")
              console.log("Account not yet active");
              res.redirect('/userLogin');
            }
            else {

              localStorage.set('user',JSON.stringify(newuser[0]));
              // req.flash("userLogin",newuser[0]);
              req.flash("success","You have successfully logged in");
              // res.render('home',{user:newuser[0]});
              res.redirect('/');

            }
          }else{
            req.flash('error',"Password does not match");
            res.redirect('back');
          }

        }else{
          req.flash("error","User doesn't exist!!!");
          console.log("login failed");
          res.redirect('back');
        }
  })

  //hash Password

});


app.post('/ngoSignupPost',function(req,res){
  console.log(req.body);

  const phoneno = req.body.phoneno;
  const regnumber = req.body.regnumber;
  const username = req.body.username;
  const aboutngo = req.body.aboutngo;
  const locationofwork = req.body.locationofwork;
  const ngoleadership = req.body.ngoleadership;
  const needyPeopleDetails = req.body.needyPeopleDetails;
  // const fullname = req.body.fullname;
  const email = req.body.email;
  const password = req.body.password;
  const confirmpassword = req.body.confirmpassword;
  const token = randomstring.generate();
  var newNgo;
  if (password != confirmpassword){

    console.log("Password not matched");
    req.flash('error',"Password does not match");
    res.redirect('back');

    return;
  }


  Ngo.find({email:email},function(err,allNgos){
    if (err){
      console.log(err);
    }else{
      if (allNgos.length == 0){
        //we can create a new User
        //use bcrypt

          newNgo = new Ngo({
            phoneno:phoneno,
            regnumber:regnumber,
            username:username,
            aboutngo:aboutngo,
            locationofwork:locationofwork,
            ngoleadership:ngoleadership,
            needyPeopleDetails:needyPeopleDetails,
            email:email,
            password:password,
            token:token //email verification
          });


        bcryptNodejs.hash(req.body.password, null, null, (err, hash)=> {
            if (err){
                console.log(err);
                req.flash("error",err.message);
            }else{

                newNgo.password = hash;
                console.log("Hash: ",hash);
                Ngo.register(newNgo,req.body.password,(err,user)=>{
                    if (err){
                        // console.log(err.message);
                        req.flash("error",err.message);
                        // user.g = 0;
                        res.redirect("back");
                    }else{
                        // passport.authenticate("local",{ failureRedirect: 'back',failureFlash:true })(req,res,function(){
                            // user.g = 1
                            var mailOptions = {
                              from: 'gcgcgc926@gmail.com',
                              to: ''+(newNgo.email),
                              subject: 'NGO Confirmation email for Need E-Help',
                              html: `<h1>Thanks for Registering your NGO to Need E-Help</h1>
                                     <br><br>Your secret token is <b>`+newNgo.token+`<b>
                                     <br><br> <a href="http://localhost:3000/verifyNgo">Click on the following link to verify email</a>`
                            };
                            transporter.sendMail(mailOptions, function(error, info) {
                              if(error) console.log(error);
                              else {
                                console.log("email sent "+ info.response);
                              }
                            });
                            req.flash("success","An email has been sent for activiation");
                            res.redirect("/");

                        // });
                        console.log('hi');
                        // res.redirect('/');
                  }
              });
            }

        });


      }else{
        req.flash('error',"Email-Id already exists");
        res.redirect('back');

      }
    }
  })
});


app.post('/ngoLoginPost',function(req,res){
  console.log(req.body);

  /*
  { username: '18103021',
    password: 'Chaitanya@1',
  }
  */

  const regnumber = req.body.regnumber;
  const password = req.body.password;


    Ngo.find({regnumber:regnumber},function(err,newuser){
        if (newuser.length>0){
          var result = bcryptNodejs.compareSync(password,newuser[0].password);
          if (result == true){
            if(newuser[0].active == false) {
              req.flash("error","Account not yet activated")
              console.log("Account not yet active");
              res.redirect('/ngo-login');
            }
            else {
              req.flash("success","you have successfully logged in");
              localStorage.set('user',JSON.stringify(newuser[0]));
              res.redirect('/');
            }
          }else{
            req.flash('error',"password not matched");
            res.redirect('back');
          }

        }else{
          req.flash("error","User doesn't exist!!!");
          console.log("login failed");
          res.redirect('back');
        }
  })
})


//Logout

app.get('/logout',function(req,res){
  req.logout();
  localStorage.set('user',undefined);
  req.flash("success","you have successfully logged out")
  res.redirect('/');
})


app.listen('3000',function(){
  console.log("Server Running on port 3000");
});
