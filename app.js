require('dotenv').config();
const express=require("express");
const ejs=require("ejs");
const path=require("path")
const mongoose=require("mongoose")
const md5=require('md5');
const app=express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'))
app.use(express.urlencoded({extended:true}));

mongoose.connect('mongodb://localhost:27017/authDEMO', {useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify:false })
    .then(()=>{
        console.log("Connection establish");
    })
    .catch(err=>{
        console.log("Something went wrong");
        console.log(err);
    })

const userSchema=new mongoose.Schema({
    email:String,
    password:String
})


const User=new mongoose.model("User",userSchema);

app.get('/',(req,res)=>{ 
    res.render("home.ejs")
})
app.get('/login',(req,res)=>{
    res.render("login.ejs")
})
app.get('/register',(req,res)=>{
    res.render("register.ejs")
})
app.post('/register',async(req,res)=>{
    const {username, password}=req.body;
    const newUser=new User({email:username,password:md5(password)});
    await newUser.save((err)=>{
        if(err) {
            console.log(err)
        } else {
            res.render("secrets.ejs")
        }
    });
})

app.post('/login',async(req,res)=>{
    const {username,password}=req.body;
    const user=await User.findOne({email:username},function(err,foundUser){
        if(err){
            console.log(err)
        } else {
            if(foundUser){
                if(foundUser.password===md5(password)){
                    res.render("secrets.ejs")
                } else {
                    res.send("password is incorrect")
                }
            }
        } 
    })
})

app.listen(3000,()=>{
    console.log("Server started on port number 3000");
})