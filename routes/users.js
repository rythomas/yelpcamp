var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var Review = require("../models/review");
var middleware = require("../middleware");
var User       = require("../models/user");
var Campground = require("../models/campground");
var Comment    = require("../models/comment");
var Review     = require*("../models/review");

// Show User Profiles
router.get("/:id", function(req,res){
  User.findById(req.params.id, function(err, foundUser){
    if(err){
      req.flash("error", "Something went wrong.");
      res.redirect("/campgrounds");
    }
    Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds){
      if(err){
      req.flash("error", "Something went wrong.");
      res.redirect("/campgrounds");
    }
     res.render("users/show", {user: foundUser, campgrounds: campgrounds});
    });
  });
});

//Edit Route
router.get("/:id/edit", middleware.checkUserOwnership, function(req,res){
    User.findById(req.params.id,function(err, foundUser){
        if(err){
            console.log(err);
        } else {
            res.render("users/edit", {user: foundUser});
    
        }
        });
   
});

//Update
router.put("/:id", middleware.checkUserOwnership, function(req,res){
    User.findByIdAndUpdate(req.params.id, req.body.user, function(err,updatedComment){
        if(err){
            res.redirect("back");
        } else{
            res.redirect("/users/" + req.params.id);
        }
    });
});

module.exports = router;