var Campground = require("../models/campground");
var Comment    = require("../models/comment");
var Review     = require("../models/review");
var User       = require("../models/user");
//all middleware goes here
var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req,res,next){
    if(req.isAuthenticated()){
       Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
           req.flash("error", "Campground not found");
           res.redirect("back");
        } else {
            //does user own campground
            if(foundCampground.author.id.equals(req.user._id)){
               next();
            } else {
                req.flash("error", "You don't have permission to do that");
                res.redirect("back");
            }
        }
    });
   } else {
      res.redirect("back");
   }
};

middlewareObj.checkCommentOwnership = function(req,res,next){
    if(req.isAuthenticated()){
       Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            req.flash("error", "You need to be logged in to do that");
            res.redirect("back");
        } else {
            //does user own comment
            if(foundComment.author.id.equals(req.user._id)){
               next();
            } else {
                req.flash("error", "You don't have permission to do that");
                res.redirect("back");
            }
        }
    });
   } else {
      res.redirect("back");
   }
};

middlewareObj.isLoggedIn = function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
};

middlewareObj.checkUserOwnership = function(req,res,next){
    if(req.isAuthenticated()){
        User.findById(req.params.id, function(err, foundUser){
            if(err){
                req.flash("error", "Something went wrong");
                res.redirect("back");
            } else {
                //does user match profile
                if(foundUser.id == req.user._id){
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        res.redirect("back");
    }
};

middlewareObj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the comment?
                if(foundReview.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Campground.findById(req.params.id).populate("reviews").exec(function (err, foundCampground) {
            if (err || !foundCampground) {
                req.flash("error", "Campground not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundCampground.reviews
                var foundUserReview = foundCampground.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("back");
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};


module.exports = middlewareObj;