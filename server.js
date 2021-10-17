const bcrypt = require("bcrypt");
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const flash = require("connect-flash");
const session = require("express-session");
const { urlencoded } = require("body-parser");
const LocalStrategy = require("passport-local").Strategy;
const config = require("./config");
const User = require("./models/User");
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
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        await mongoose.connect(config.mongodb.uri);
        const user = await User.findOne({ email });

        if (!user || !bcrypt.compareSync(password, user.password)) {
          return done(null, false, { message: "Incorrect credentials" });
        }

        return done(null, user); // sucessful login
      } catch (err) {
        done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  await mongoose.connect(config.mongodb.uri);
  const user = await User.findOne({ _id: id });
  done(null, user);
});

app.get("/login", (req, res) => {
  res.render("login.ejs", { error: req.flash("error") });
});
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);
app.get("/register", (req, res) => {
  res.render("register.ejs");
});
app.post("/register", async (req, res) => {
  await mongoose.connect(config.mongodb.uri);
  const { name, email, password } = req.body;
  await User.create({
    name,
    email,
    password: bcrypt.hashSync(password, 10),
  });
  res.redirect("/login");
});

app.use((req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
});

app.get("/", async (req, res) => {
  await mongoose.connect(config.mongodb.uri);
  const issues = await Issue.find({});
  const messages = req.flash("messages");
  res.render("issues.list.ejs", { issues, messages });
});

app.get("/create", showCreateOrEditIssue);
app.post("/create", createOrUpdateIssue);
app.get("/edit/:id", showCreateOrEditIssue);
app.post("/edit/:id", createOrUpdateIssue);
app.post("/delete/:id", async (req, res) => {
  await mongoose.connect(config.mongodb.uri);
  await Issue.deleteOne({ _id: req.params.id });
  req.flash("messages", "The issue was deleted succesfully");
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.listen(config.port, () => {
  console.log(`Listening on port ${config.port}`);
});
