require("dotenv").config();

const { token } = process.env;

const baseURL = "https://beatconnect.io";

exports.baseURL = baseURL;
exports.token = token;
