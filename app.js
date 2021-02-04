//jshint esversion:6
const express=require("express");
const ejs=require("ejs");

const app=express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(express.urlencoded({extended:true}));

app.get('/',(req,res)=>{
    res.render("home.ejs")
})
app.get('/login',(req,res)=>{
    res.render("login.ejs")
})
app.get('/register',(req,res)=>{
    res.render("register.ejs")
})

app.listen(3000,()=>{
    console.log("Server started on port number 3000");
})