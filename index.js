// index.js
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./DBConnection");

const authRoutes = require("./routes/authRoute");
const errorHandler = require("./middlewares/errorHandler");
// Load environment variables
dotenv.config();

// Create express app
const app = express();

// Connect to MongoDB
connectDB();

// Routes
app.use(express.json()); // Middleware to parse JSON requests
app.use("/api/auth", authRoutes);

// Error handling middleware'
app.use(errorHandler);
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
