const Schedule = require("../models/Schedule");
const createError = require("../util/createError");
const sendSuccess = require("../util/sendSucess");
const GetSchedule = async (req, res, next) => {
  try {
    const ShecduleData = await Schedule.find();
    if (!ShecduleData || ShecduleData.length === 0) {
      return next(
        createError("No schedule found", 404, {
          code: "SCHEDULE_NOT_FOUND",
          details: { message: "No schedule data available" },
        })
      );
    }
    sendSuccess(res, 200, "Schedule retrieved successfully", {
      data: { schedule: ShecduleData },
    });
  } catch (err) {
    next(
      createError("Failed to retrieve schedule", 500, {
        code: "SCHEDULE_RETRIEVAL_ERROR",
        details: { message: err.message },
      })
    );
  }
};

const AddSchedule = async (req, res, next) => {
  try {
    const existingSchedule = await Schedule.find({});
    if (existingSchedule.length > 0) {
      return next(
        createError("Schedule already exists", 400, {
          code: "SCHEDULE_EXISTS",
          details: { message: "Schedule already created" },
        })
      );
    }
    const newSchedule = await new Schedule();
    await newSchedule.save();
    sendSuccess(res, 201, "Schedule created successfully", {
      data: { schedule: newSchedule },
    });
  } catch (error) {
    next(
      createError("Failed to create schedule", 500, {
        code: "SCHEDULE_CREATION_ERROR",
        details: { message: error.message },
      })
    );
  }
};

const UpdateSchedule = async (req, res, next) => {
  const { day } = req.params;
  const updateData = req.body; // { isAvailable, startTime, endTime }
  const allowedDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  if (!allowedDays.includes(day)) {
    return next(
      createError("Invalid day name", 400, {
        code: "INVALID_DAY",
      })
    );
  }

  try {
    const updated = await Schedule.findOneAndUpdate(
      {},
      { [`${day}`]: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return next(
        createError("Schedule not found", 404, {
          code: "SCHEDULE_NOT_FOUND",
          details: { message: "No schedule data available for update" },
        })
      );
    }

    sendSuccess(res, 200, "Schedule updated successfully", {
      data: { schedule: updated },
    });
  } catch (err) {
    next(
      createError("Failed to update schedule", 500, {
        code: "SCHEDULE_UPDATE_ERROR",
        details: { message: err.message },
      })
    );
  }
};

const DropSchedule = async (req, res, next) => {
  try {
    const result = await Schedule.deleteMany({});
    if (result.deletedCount === 0) {
      return next(
        createError("No schedule found to delete", 404, {
          code: "SCHEDULE_NOT_FOUND",
          details: { message: "No schedule data available for deletion" },
        })
      );
    }
    sendSuccess(res, 200, "Schedule deleted successfully", {
      data: { deletedCount: result.deletedCount },
    });
  } catch (err) {
    next(
      createError("Failed to delete schedule", 500, {
        code: "SCHEDULE_DELETION_ERROR",
        details: { message: err.message },
      })
    );
  }
};
module.exports = {
  GetSchedule,
  AddSchedule,
  UpdateSchedule,
  DropSchedule,
};
