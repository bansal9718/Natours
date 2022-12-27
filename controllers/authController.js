const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const cookieSession = require('cookie-session');
//for sign in use jwt.sign
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  // const cookieOptions = {
  //   expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  //   httpOnly: true,
  // };
  // cookieOptions.secure = true;
  // res.cookie('jwt', token, cookieOptions);

  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  // res.cookie('jwt', token, cookieOptions);
  // //remove password from output
  // user.password = undefined;
  res.cookie('jwt', token, {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,

    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  // Remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  createAndSendToken(newUser, 201, req, res);
  // const token = signToken(newUser._id);

  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  //desctructuring
  const { email, password } = req.body;
  //1)if email and password exists
  if (!email || !password) {
    return next(new AppError('please provide email and password', 404));
  }

  //2) if the user exists && passwrod is correct
  const user = await User.findOne({ email }).select('+password');

  // const correct = await user.correctPassword(password, user.Password);
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email and Password', 401));
  }

  // console.log(password);

  // console.log(user);

  //3)if everything is ok,send token back to client
  createAndSendToken(user, 200, req, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 100 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting token and check if it exists
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    console.log(token);
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in!,please log in to get access.'),
      401
    );
  }

  //2 )Verification token
  // for verification we use jwt.verify function alongwith promisify utils
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3)Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists ')
    );
  }
  //4))if user change passwords after the jwt was issued
  if (currentUser.changesPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    );
  }
  // console.log(decoded.iat);
  req.user = currentUser;
  res.locals.user = currentUser;

  //Grant access to protected route
  next();
});

//Only for rendered pages and there will be no errors!
exports.isLoggedIn = async (req, res, next) => {
  //1) Getting token and check if it exists

  if (req.cookies.jwt) {
    //verify token
    try {
      token = req.cookies.jwt;
      // for verification we use jwt.verify function alongwith promisify utils
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //3)Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //4))if user change passwords after the jwt was issued
      if (currentUser.changesPasswordAfter(decoded.iat)) {
        return next();
      }
      //There is a logged in user
      // console.log(decoded.iat);
      res.locals.user = currentUser;
      //Grant access to protected route
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

//FOR AUTHORIZARION
//wrapper function
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array
    //includes is an javascript method
    if (!roles.includes(req.user.role)) {
      return next(new AppError('you do not have permission to access', 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1)Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user with this email-address', 404));
  }
  // 2)Generate random test token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3)send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot ur password? submit a PATCH request with ur new password and passwordConfirm to:${resetURL}.\nIf u didn't forgot your password , please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // console.log(err);
    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1)get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2) if token has not expired , and there is a user , set the new password
  if (!user) {
    return next(new AppError('Token is invalid or Expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3)update changedPasswordAt property for the user using(middleware)

  //4) log the user in , send JWT
  createAndSendToken(user, 200, req, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'succes',
  //   token,
  // });
});

exports.updatePassword = async (req, res, next) => {
  //1) get the user from the collection
  const user = await User.findById(req.user.id).select('+password');
  //2)if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }
  //3)if the password is correct update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4)log user in , send jwt
  createAndSendToken(user, 200, req, res);
};
