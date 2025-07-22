const Router = require("express").Router();
const { Register, login } = require("../controllers/authController");

// Register route
Router.post("/register", Register);
Router.post("/login", login);

module.exports = Router;
