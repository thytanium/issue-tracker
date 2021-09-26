const express = require("express");
const mongoose = require("mongoose");
const { urlencoded } = require("body-parser");
const config = require("./config");
const issue = require("./models/issue");

const app = express();

app.set("view engine", "ejs");

app.use(urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  await mongoose.connect(config.mongodb.uri);

  const issues = await issue.find({});

  res.render("issues.list.ejs", { issues });
});

app.get("/create", (req, res) => {
  res.render("issues.create.ejs");
});

app.post("/create", async (req, res) => {
  await mongoose.connect(config.mongodb.uri);

  const { title, comment, status } = req.body;

  if (!title) {
    res.redirect("/create");
    return;
  }

  await issue.create({ title, comment, status });

  res.redirect("/");
});

app.listen(config.port, () => {
  console.log(`Listening on port ${config.port}`);
});
