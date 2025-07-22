const User = require("../models/User");
const bcrypt = require("bcryptjs");
const createError = require("../util/createError");
const {
  registerSchema,
} = require("../util/validations/RegistrationValidation");
const { generateAccessToken, generateRefreshToken } = require("../util/token");
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

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    next(
      createError("Registration failed", 500, {
        code: "REGISTRATION_ERROR",
        details: { message: err.message },
      })
    );
  }
};

// const login = async (req, res, next) => {
//   // take the inputs
//   //validate the inputs  --> not needed as we already have a schema
//   //check if the user exists
//   //check if the password is correct
//   //generate the access token and refresh token
//   // send the access token in the response
//   //send the refresh token in the cookies
// };

const login = async (req, res, next) => {
  // 1️⃣ استلام البيانات من الـ body
  const { email, password } = req.body;
  // 3️⃣ التحقق إن المستخدم موجود
  const user = await User.findOne({ email });
  if (!user) {
    return next(
      createError("Invalid email or password", 401, {
        code: "INVALID_CREDENTIALS",
        details: { email },
      })
    );
  }

  // 4️⃣ التحقق من كلمة السر (مع المقارنة باستخدام bcrypt)
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(
      createError("Invalid email or password", 401, {
        code: "INVALID_CREDENTIALS",
        details: { email },
      })
    );
  }

  // 5️⃣ توليد Access Token و Refresh Token
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);

  // 6️⃣ حفظ الـ Refresh Token في الكوكيز (Secure + HttpOnly)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // https فقط في production
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // مثلاً 7 أيام
  });

  // 7️⃣ إرسال الـ Access Token في الـ response
  res.status(200).json({
    message: "Login successful",
    accessToken,
    user: {
      id: user._id,
      role: user.role,
      name: user.name,
    },
  });
};

const refreshToken = (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) return res.sendStatus(401);

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403); // Token expired or invalid

    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken: newAccessToken });
  });
};
module.exports = {
  Register,
  refreshToken,
  login,
};
