const express = require("express");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");
const { urlencoded } = require("body-parser");
const config = require("./config");
const Issue = require("./models/Issue");
const createOrUpdateIssue = require("./createOrUpdateIssue");
const showCreateOrEditIssue = require("./showCreateOrEditIssue");

const app = express();

app.set("view engine", "ejs");

app.use(urlencoded({ extended: true }));
app.use(
  session({
    name: config.session.cookieName,
    secret: config.session.secret,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

app.get("/", async (req, res) => {
  await mongoose.connect(config.mongodb.uri);

  const issues = await Issue.find({});

  res.render("issues.list.ejs", { issues });
});

app.get("/create", showCreateOrEditIssue);
app.post("/create", createOrUpdateIssue);
app.get("/edit/:id", showCreateOrEditIssue);
app.post("/edit/:id", createOrUpdateIssue);

app.listen(config.port, () => {
  console.log(`Listening on port ${config.port}`);
});
