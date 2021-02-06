require('dotenv').config();
const express=require("express");
const ejs=require("ejs");
const path=require("path")
const mongoose=require("mongoose")
const app=express();
const session = require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require('mongoose-findorcreate');


app.use(express.static("public"));
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'))
app.use(express.urlencoded({extended:true}));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/authDEMO', {useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify:false })
    .then(()=>{
        console.log("Connection Establish");
    })
    .catch(err=>{
        console.log("Something Went Wrong");
        console.log(err);
    })
mongoose.set('useCreateIndex', true);

const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String
})
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
  
const User=new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/',(req,res)=>{ 
    res.render("home.ejs")
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
});

app.get('/login',(req,res)=>{
    res.render("login.ejs")
})

app.get('/register',(req,res)=>{
    res.render("register.ejs")
})

app.get('/secrets',(req,res)=>{
    if(req.isAuthenticated()){
        res.render('secrets');
    } else {
        res.redirect('/login');
    }
})

app.get('/logout',(req,res)=>{
    req.logout();
    res.redirect('/')
})

app.post('/register',async(req,res)=>{
        User.register(new User({ username : req.body.username }), req.body.password, function(err, registerUser) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }
        passport.authenticate('local')(req, res, function () {
          res.redirect('/secrets');
        });
    });
})

app.post('/login',passport.authenticate('local', { successRedirect: 'secrets',failureRedirect: '/login' }));

app.listen(3000,()=>{
    console.log("Server started on port number 3000");
})