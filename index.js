/**
 * Server Entry Point
 *
 * This file starts the HTTP server by importing the configured Express app
 * and calling app.listen(). The app configuration is separated into app.js
 * to allow testing without starting the actual server.
 */

const app = require("./app");

// Start server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(
    `📚 API Documentation available at http://localhost:${PORT}/api-docs`
  );
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("🔥 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("💀 Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("🔥 SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("💀 Process terminated");
  });
});
