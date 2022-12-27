const Review = require('./../models/reviewModel');
const APIFeatures = require('./../utils/apifeatures');
const factory = require('./handleFactory');
// const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');



exports.setUsersId = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
exports.getAllReviews = factory.getAll(Review);
exports.createReview = factory.createOne(Review);
exports.getReview = factory.getOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
