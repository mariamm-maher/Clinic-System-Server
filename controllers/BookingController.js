const Booking = require("../models/booking");
const createError = require("../util/createError");
const sendSuccess = require("../util/sendSucess");
const {
  bookingSchema,
  updateBookingSchema,
} = require("../util/validations/BookingValidation");

const CreateBooking = async (req, res, next) => {
  try {
    // Validate request body against the schema
    const { error, value } = bookingSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return next(
        createError("Validation Error", 400, {
          code: "VALIDATION_FAILED",
          details: error.details.map((err) => err.message),
        })
      );
    }

    const {
      patientId,
      patientName,
      patientPhone,
      day,
      time,
      createdFrom,
      status,
      notes,
      createdBy,
    } = value;

    const newBooking = new Booking({
      patientId: patientId || null,
      patientName,
      patientPhone,
      day,
      time,
      createdFrom,
      status: status || "pending",
      notes: notes || "",
      createdBy: createdBy || null,
    });

    await newBooking.save();
    sendSuccess(res, 201, "Booking created successfully", {
      data: { booking: newBooking },
    });
  } catch (err) {
    next(
      createError("Failed to create booking", 500, {
        code: "BOOKING_CREATION_ERROR",
        details: { message: err.message },
      })
    );
  }
}; //should apply filters ?
const GetAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find();
    if (!bookings || bookings.length === 0) {
      return next(
        createError("No bookings found", 404, {
          code: "BOOKINGS_NOT_FOUND",
          details: { message: "No booking data available" },
        })
      );
    }
    sendSuccess(res, 200, "Bookings fetched successfully", {
      data: { bookings },
    });
  } catch (error) {
    next(
      createError("Failed to fetch bookings", 500, {
        code: "BOOKINGS_FETCH_ERROR",
        details: { message: error.message },
      })
    );
  }
};

const GetBookingById = async (req, res, next) => {
  const { bookingId } = req.params;
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(
        createError("Booking not found", 404, {
          code: "BOOKING_NOT_FOUND",
          details: { bookingId },
        })
      );
    }
    sendSuccess(res, 200, "Booking fetched successfully", {
      data: { booking },
    });
  } catch (error) {
    next(
      createError("Failed to fetch booking", 500, {
        code: "BOOKING_FETCH_ERROR",
        details: { message: error.message },
      })
    );
  }
};
const UpdateBooking = async (req, res, next) => {
  const { bookingId } = req.params;

  try {
    // Validate request body against the update schema
    const { error, value } = updateBookingSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return next(
        createError("Validation Error", 400, {
          code: "VALIDATION_FAILED",
          details: error.details.map((err) => err.message),
        })
      );
    }
    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, value, {
      new: true,
      runValidators: true,
    });

    if (!updatedBooking) {
      return next(
        createError("Booking not found", 404, {
          code: "BOOKING_NOT_FOUND",
          details: { bookingId },
        })
      );
    }

    sendSuccess(res, 200, "Booking updated successfully", {
      data: { booking: updatedBooking },
    });
  } catch (error) {
    next(
      createError("Failed to update booking", 500, {
        code: "BOOKING_UPDATE_ERROR",
        details: { message: error.message },
      })
    );
  }
};

module.exports = {
  CreateBooking,
  GetAllBookings,
  GetBookingById,
  UpdateBooking,
};
