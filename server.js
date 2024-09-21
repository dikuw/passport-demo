import express from "express";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import passport from "passport";
import flash from "express-flash";
import session from "express-session";
import initializePassport from "./passport-config.js";
import methodOverride from "method-override";

dotenv.config();

initializePassport( 
  passport, 
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
);

const app = express();

const PORT = process.env.PORT || 3000;

const users = [];

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login')
};

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
};

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.get("/", checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user ? req.user.name : 'Guest' });
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render('login.ejs');
});

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render('register.ejs');
});

app.post("/login", passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

app.post("/register", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });
        res.redirect("/login");
    } catch (error) {
        res.status(500).send("Error registering user");
    }
    console.log("users", users);
});

app.delete('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/login');
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});