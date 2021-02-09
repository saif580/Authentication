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
const FacebookStrategy=require('passport-facebook');
const dburl=process.env.DB_URL;

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

// mongodb://localhost:27017/authDEMO
mongoose.connect(dburl, {useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify:false })
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
    googleId:String,
    facebookId:String,
    secret:String
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
    User.findOrCreate({username:profile.emails[0].value, googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FB_CLIENT,
    clientSecret: process.env.FB_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets",
    profileFields: ["id", "displayName", "email"],
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/',(req,res)=>{ 
    res.render("home.ejs")
})
// https://immense-beyond-68906.herokuapp.com/auth/google/secrets
// /auth/google'
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile',"email"] })
);
// /auth/google/secrets
app.get('https://immense-beyond-68906.herokuapp.com/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
});

app.get("/auth/facebook", passport.authenticate("facebook"));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
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
    User.find({"secret":{$ne:null}},(err,foundUsers)=>{
       if(err){
           console.log(err)
       } else {
           if(foundUsers){
               res.render("secrets",{allSecrets:foundUsers});
           }
       }
   })
})

app.get('/submit',(req,res)=>{
    if(req.isAuthenticated()){
        res.render('submit');
    } else {
        res.redirect('/login');
    }
})

app.post('/submit',async(req,res)=>{
    const submitSecret=req.body.secret;
    await User.findById(req.user.id,(err,foundUser)=>{
        if(err){
            console.log(err)
        } else {
            if(foundUser){
                foundUser.secret=submitSecret;
                foundUser.save(function() {
                    res.redirect('/secrets')
                });
            }
        }
    });
    
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

const port=process.env.PORT||3000;
app.listen(port,()=>{
    console.log("Server started on port number 3000");
})