const express = require("express");
const bodyParser = require('body-parser');
const router = express.Router();
const userContoller = require("../controllers/users");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE,
});
router.get(["/", "/login"], (req, res) => {
  //res.send("<h1>Hello Tutor Joes Salem</h1>");
  res.render("login");
});

router.get("/register", (req, res) => {
  res.render("register");
});
router.get("/profile", (req,res) => {
  const score = req.query.score;
  res.render("profile",{score });
  });
router.get("/home", userContoller.isLoggedIn, (req,res) => {
    console.log(req.name);
    res.render("home");
    });
router.get("/display", userContoller.isLoggedIn, (req,res) => {
      res.render("display");
      });
router.get("/quiz", userContoller.isLoggedIn, (req,res) => {
        const score=0;
        res.render("quiz");
        });

router.get("/assignment", userContoller.isLoggedIn, (req, res) => {
  console.log(req);
          const loggedInUserId = req.query.id;
          console.log("loggedInUserId is", loggedInUserId);
          
          db.query('SELECT * FROM users WHERE id = ?', [loggedInUserId], (error, results) => {
            if (error) {
              console.log(error);
              return res.status(500).send('Internal Server Error');
            }
        
            const student = results[0];
            console.log("student ", student);
        
            db.query('SELECT subject_id FROM subject_assigned WHERE student_id = ?', [loggedInUserId], (error, subjectResults) => {
              if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
              } 
        
              console.log("retrieved subjects is", subjectResults);
        
              if (subjectResults.length === 0) {
                // No subjects assigned
                const assignedSubjects = ["No subjects assigned"];
                res.render('assignment', { student, assignedSubjects, studentId: loggedInUserId });
              } else {
                // Retrieve subject names based on subject_id
                const subjectIds = subjectResults.map(subject => subject.subject_id);
                db.query('SELECT sub_name FROM subjects WHERE sub_id IN (?)', [subjectIds], (error, subjectNameResults) => {
                  if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                  }
        
                  const assignedSubjects = subjectNameResults.map(subject => subject.sub_name);
                  console.log(assignedSubjects);
                  res.render('assignment', { student, assignedSubjects, studentId: loggedInUserId });
                });
              }
            });
          });
        });
        
        
router.get("/dashboard", userContoller.isLoggedIn, (req,res) => {
          console.log("---------------");
          console.log(req.query.id);
         const loggedInUserId = req.query.id;
         //console.log(loggedInUserId);
         db.query('SELECT * FROM users WHERE teacher_id = ?', [loggedInUserId], (error, results) => {
    if (error) {
      console.log(error);
              // Handle the error appropriately
      return res.status(500).send('Internal Server Error');
    }
     //console.log(results);       
    res.render('dashboard', { users: results });
          }); 
  });

router.get("/logout", (req,res) => {
      res.render("login");
      });
   

/*router.get("/profile", userContoller.isLoggedIn, (req, res) => {
  if (req.user) {
    res.render("profile", { user: req.user });
    console.log(req.user);
  } else {
    res.redirect("/login");
  }
});
router.get("/home", userContoller.isLoggedIn, (req, res) => {
  //console.log(req.name);
  if (req.user) {
    res.render("home", { user: req.user });
  } else {
    res.redirect("/home");
  }
});*/

module.exports = router;