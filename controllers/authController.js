const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createError = require("../util/createError");
const sendSuccess = require("../util/sendSucess");
const {
  registerSchema,
} = require("../util/validations/RegistrationValidation");
const { generateAccessToken, generateRefreshToken } = require("../util/token");
const getTokensFromGoogle = require("../util/googleToken");

const Register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    // Validate request body against the schema
    const { error } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return next(
        createError("Validation Error", 400, {
          code: "VALIDATION_FAILED",
          details: error.details.map((err) => err.message),
        })
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(
        createError("User already exists", 400, {
          code: "USER_EXISTS",
          details: { email },
        })
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    sendSuccess(res, 201, "User registered successfully", {
      data: { userId: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    next(
      createError("Registration failed", 500, {
        code: "REGISTRATION_ERROR",
        details: { message: err.message },
      })
    );
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(
      createError("Invalid email or password", 401, {
        code: "INVALID_CREDENTIALS",
        details: { email },
      })
    );
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(
      createError("Invalid email or password", 401, {
        code: "INVALID_CREDENTIALS",
        details: { email },
      })
    );
  }
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // https فقط في production
    sameSite: "Strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  sendSuccess(res, 200, "Login successful", {
    data: { accessToken, userId: user._id, name: user.name, role: user.role },
  });
};

const refreshToken = (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) return next(createError("Refresh token is required", 401));
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err)
      return next(
        createError(
          "Refresh token is expired , your session is ended , login again !",
          403
        )
      );
    const newAccessToken = generateAccessToken(decoded.id, decoded.role);

    sendSuccess(res, 200, "Token refreshed successfully", {
      data: { accessToken: newAccessToken },
    });
  });
};

const googleCallback = async (req, res, next) => {
  const code = req.query.code;
  const googlRes = await getTokensFromGoogle(code);
  const user = jwt.decode(googlRes.id_token);
  const existingUser = await User.findOne({ email: user.email });
  let finalUser;
  if (!existingUser) {
    const newUser = new User({
      name: user.name,
      email: user.email,
      role: "doctor",
      google: true, // نعلم إنه جاي من Google
      // password: null, // أو سيبها مش موجودة
    });
    finalUser = await newUser.save();
  } else {
    finalUser = existingUser;
  }

  const accessToken = generateAccessToken(finalUser._id, finalUser.role);
  const refreshToken = generateRefreshToken(finalUser._id, finalUser.role);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // https فقط في production
    sameSite: "Strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.redirect(
    `http://localhost:5173/patients?accessToken=${accessToken}&name=${user.name}&id=${user._id}&role=${user.role}`
  );
};

module.exports = {
  Register,
  refreshToken,
  login,
  googleCallback,
};
