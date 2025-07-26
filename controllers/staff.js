const User = require("../models/User");
const bcrypt = require("bcryptjs");
const createError = require("../util/createError");
const sendSuccess = require("../util/sendSucess");
const {
  registerSchema,
} = require("../util/validations/RegistrationValidation");

// Create new user with role staff
const createStaffUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate request body against the schema
    const { error } = registerSchema.validate(
      {
        ...req.body,
        role: "staff", // Force role to be staff
      },
      { abortEarly: false }
    );

    if (error) {
      return next(
        createError("Validation Error", 400, {
          code: "VALIDATION_FAILED",
          details: error.details.map((err) => err.message),
        })
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(
        createError("User already exists", 400, {
          code: "USER_EXISTS",
          details: { email },
        })
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new staff user
    const newStaffUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "staff",
    });

    await newStaffUser.save();

    sendSuccess(res, 201, "Staff user created successfully");
  } catch (err) {
    next(
      createError("Failed to create staff user", 500, {
        code: "STAFF_CREATION_ERROR",
        details: { message: err.message },
      })
    );
  }
};

// Delete user
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return next(
        createError("User ID is required", 400, {
          code: "MISSING_USER_ID",
          details: {
            message: "User ID must be provided in the URL parameters",
          },
        })
      );
    }

    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return next(
        createError("User not found", 404, {
          code: "USER_NOT_FOUND",
          details: { userId },
        })
      );
    }

    sendSuccess(res, 200, "User deleted successfully");
  } catch (err) {
    next(
      createError("Failed to delete user", 500, {
        code: "USER_DELETION_ERROR",
        details: { message: err.message },
      })
    );
  }
};

// Get all staff users
const getAllStaff = async (req, res, next) => {
  try {
    const staffUsers = await User.find({ role: "staff" }).select("-password");

    sendSuccess(res, 200, "Staff users retrieved successfully", {
      data: { staff: staffUsers, count: staffUsers.length },
    });
  } catch (err) {
    next(
      createError("Failed to retrieve staff users", 500, {
        code: "STAFF_RETRIEVAL_ERROR",
        details: { message: err.message },
      })
    );
  }
};

// Get staff user by ID
const getStaffById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return next(
        createError("User ID is required", 400, {
          code: "MISSING_USER_ID",
          details: {
            message: "User ID must be provided in the URL parameters",
          },
        })
      );
    }

    const staffUser = await User.findOne({
      _id: userId,
      role: "staff",
    }).select("-password");

    if (!staffUser) {
      return next(
        createError("Staff user not found", 404, {
          code: "STAFF_NOT_FOUND",
          details: { userId },
        })
      );
    }

    sendSuccess(res, 200, "Staff user retrieved successfully", {
      data: { user: staffUser },
    });
  } catch (err) {
    next(
      createError("Failed to retrieve staff user", 500, {
        code: "STAFF_RETRIEVAL_ERROR",
        details: { message: err.message },
      })
    );
  }
};

module.exports = {
  createStaffUser,
  deleteUser,
  getAllStaff,
  getStaffById,
};
