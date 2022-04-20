const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const api = require("./routes/api");

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));

// default - combined
app.use(morgan("combined"));

app.use(express.json());

// serving frontend website

app.use(express.static(path.join(__dirname, "..", "public")));

// Version of apis
app.use("/v1", api);

// handling client side routing paths
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

module.exports = app;
