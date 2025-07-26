const mongoose = require("mongoose");

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const dailyScheduleSchema = {
  isAvailable: { type: Boolean, default: false },
  startTime: {
    type: String,
    default: "00:00",
    validate: {
      validator: function (v) {
        return timeRegex.test(v);
      },
      message: (props) => `${props.value} is not a valid time format (HH:mm)`,
    },
  },
  endTime: {
    type: String,
    default: "00:00",
    validate: {
      validator: function (v) {
        return timeRegex.test(v);
      },
      message: (props) => `${props.value} is not a valid time format (HH:mm)`,
    },
  },
};

const doctorScheduleSchema = new mongoose.Schema({
  Sunday: dailyScheduleSchema,
  Monday: dailyScheduleSchema,
  Tuesday: dailyScheduleSchema,
  Wednesday: dailyScheduleSchema,
  Thursday: dailyScheduleSchema,
  Friday: dailyScheduleSchema,
  Saturday: dailyScheduleSchema,
});

module.exports = mongoose.model("DoctorSchedule", doctorScheduleSchema);
