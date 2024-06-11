const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path'); 
const router = express.Router();
const User = require("../models/user");
const Post = require("../models/posts");
const LoginUser = require('../models/userLogin')
const {tokenValidity}  = require('../middlewares/jwtMiddleware')

// Ensure upload directory exists
const createUploadDir = (dir) => {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Multer disk storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const user = req.user.username ;
        const uploadDir = path.join(__dirname,'..','uploads', user); 
        createUploadDir(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const user = req.user.username ;
        const name = "profilePicture";
        const uniqueSuffix = name + "-" +user + path.extname(file.originalname); 
        cb(null, uniqueSuffix);
    }
});

// Multer upload configuration
const upload = multer({ 
    storage: storage,
});

// GET route to render the upload form
router.get("/profile", tokenValidity ,(req, res) => {
    res.render("upload");
});

// POST route to handle file upload
router.post("/profile", tokenValidity ,upload.single('profileImage'), async (req, res) => {
    const email= req.user.email;
    console.log("profile : " , req.user.email);
    try {
        
        // Find user by email
        const user = await User.findOne({ email });
        const userLogin = await LoginUser.findOne({email})
        console.log("USERS : " , user , userLogin)
        
        if (!user && !userLogin) {
            return res.status(404).send('User not found');
        }
        // Check if file is uploaded
        if (!req.file) {
            return res.status(400).send('File is required');
        }
        // console.log("req.file : " , req.file) ;
        const profilePicPath =  '/' + user.username + '/'+ req.file.filename ;
        // /Souptik Taran/profilePicture-Souptik Taran.jpg
        console.log('done1')

        // Update user profile picture path
        await user.updateOne({
            email : req.body.email ,
            profilePic : profilePicPath ,
        })
        await userLogin.updateOne({
            email : req.body.email,
            profilePic : profilePicPath ,
        })
        console.log('done2')
        // Save file info to the Post model

        res.status(200).json('File uploaded and user profile updated successfully');
    } catch (err) {
        console.error('Error saving post:', err);
        res.status(500).send('Error saving post: ' + err.message);
    }
});

module.exports = router;
