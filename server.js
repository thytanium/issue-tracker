const Joi = require("joi");
const express = require("express");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");
const { urlencoded } = require("body-parser");
const config = require("./config");
const flatJoi = require("./flatJoi");
const issue = require("./models/issue");

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

  const issues = await issue.find({});

  res.render("issues.list.ejs", { issues });
});

app.get("/create", (req, res) => {
  const errors = JSON.parse(req.flash("errors")[0] || "{}");
  const form = JSON.parse(req.flash("form")[0] || "{}");
  res.render("issues.create.ejs", { errors, form });
});

app.post("/create", async (req, res) => {
  await mongoose.connect(config.mongodb.uri);

  const schema = Joi.object({
    title: Joi.string().required(),
    comment: Joi.string().max(200).required(),
    status: Joi.string().valid("Open", "Closed").required(),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  const errors = flatJoi(error);

  if (Object.keys(errors).length > 0) {
    req.flash("errors", JSON.stringify(errors));
    req.flash("form", JSON.stringify(req.body));
    res.redirect("/create");
    return;
  }

  await issue.create(req.body);

  res.redirect("/");
});

app.listen(config.port, () => {
  console.log(`Listening on port ${config.port}`);
});
