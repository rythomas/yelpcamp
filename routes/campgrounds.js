var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var Review = require("../models/review");
var middleware = require("../middleware");
var multer     = require("multer");
var storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
    //accept image files only
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({storage: storage, fileFilter: imageFilter});

var cloudinary = require("cloudinary");
cloudinary.config({
    cloud_name: 'dkrbgtuad',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//Index -show all campgrounds
router.get("/", function(req,res){
    var noMatch = null;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({"name": regex}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
                if(allCampgrounds.length === 0){
                    noMatch = "No campgrounds found matching: " + req.query.search;
                } 
                res.render("campgrounds/index", {campgrounds: allCampgrounds, currentUser: req.user, noMatch: noMatch});
            }
        });
    } else {
        //Get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
                res.render("campgrounds/index", {campgrounds: allCampgrounds, currentUser: req.user, noMatch: noMatch});
            }
        });
    }
});

//Create Route
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req,res){
    cloudinary.v2.uploader.upload(req.file.path, function(err, result){
        if(err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        // add cloudinary url for the image 
        req.body.campground.image = result.secure_url;
        //add image/s public_id to campground object
        req.body.campground.imageId = result.public_id;
        //add campground author
        req.body.campground.author = {
            id: req.user._id,
            username: req.user.username
        };
        //Create new campground and save to DB
        Campground.create(req.body.campground, function(err, campground){
            if(err){
                req.flash('error', err.message);
                return res.redirect('back');
            }
            res.redirect("/campgrounds/" + campground.id);
        });
    });
});

//New Campground
router.get("/new", middleware.isLoggedIn, function(req,res){
    res.render("campgrounds/new");
});

// SHOW - shows more info about one campground
router.get("/:id", function (req, res) {
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function (err, foundCampground) {
        if (err) {
            console.log(err);
        } else {
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

//Edit Route
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req,res){
    Campground.findById(req.params.id,function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            res.render("campgrounds/edit", {campground: foundCampground});
        }
        });
   
});

//Update
router.put("/:id", upload.single('image'), function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
                  cloudinary.v2.uploader.destroy(campground.imageId);
                  var result = cloudinary.v2.uploader.upload(req.file.path);
                  campground.imageId = result.public_id;
                  campground.image = result.secure_url;
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            campground.name = req.body.name;
            campground.description = req.body.description;
            
            campground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});

//Destroy Campground Route
router.delete('/:id', middleware.checkCampgroundOwnership, function(req, res) {
  Campground.findById(req.params.id, function(err, campground) {
    if(err) {
      req.flash("error", err.message);
      return res.redirect("back");
    } else {
        // deletes all comments associated with the campground
        Comment.remove({"_id": {$in: campground.comments}}, function (err) {
            if (err) {
                console.log(err);
                return res.redirect("/campgrounds");
            }
            // deletes all reviews associated with the campground
            Review.remove({"_id": {$in: campground.reviews}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/campgrounds");
                }
                try {
                    cloudinary.v2.uploader.destroy(campground.imageId);
                    campground.remove();
                    req.flash('success', 'Campground deleted successfully!');
                    res.redirect('/campgrounds');
                } catch(err) {
                req.flash("error", err.message);
                  return res.redirect("back");
                }
            });
        });
    }
  });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;