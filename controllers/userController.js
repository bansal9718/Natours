const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handleFactory');
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.updateMe = catchAsync(async (req, res, next) => {
  //1) create error if user post password
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError(
        'This path is not for password updates, please use /updateMypPassword',
        400
      )
    );
  }
  //1)filterd out unwanted field names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  //2)update the user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
exports.createUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route has not been defined yet',
  });
};
exports.getAllUsers = factory.getAll(User);
exports.getUsers = factory.getOne(User);
exports.deleteUsers = factory.deleteOne(User);
exports.updateUsers = factory.updateOne(User);
