const express = require("express");
const bodyParser = require('body-parser');
const userController = require("../controllers/users");
const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/display", userController.display);
router.post("/quiz", userController.quiz);
//router.post("/assignment", userController.assignment);

router.post('/assignSubject', (req, res) => {
  // Retrieve form data from request body
  const subjectFields = Object.keys(req.body).filter((field) => field.startsWith('subjects['));

  // Group names and their corresponding subjects
  const nameSubjectPairs = subjectFields.map((subjectField) => {
    const name = subjectField.split('[')[1].split(']')[0];
    const subjects = Array.isArray(req.body[subjectField]) ? req.body[subjectField] : [req.body[subjectField]];
    return { name, subjects };
  });

  // Insert the data into the database
  const mysql = require('mysql2');
  const connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE,
  });

  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database: ', err);
      res.status(500).send('Error connecting to the database');
      return;
    }

    const insertPromises = nameSubjectPairs.map(({ name, subjects }) => {
      return new Promise((resolve, reject) => {
        // Get the student ID from the 'users' table
        const getStudentIdQuery = 'SELECT id FROM users WHERE name = ?';
        connection.query(getStudentIdQuery, [name], (error, results) => {
          if (error) {
            console.error('Error retrieving student ID from the USERS database: ', error);
            reject(error);
            return;
          }

          if (results.length === 0) {
            console.error(`Student ${name} not found`);
            reject(`Student ${name} not found`);
            return;
          }

          const studentId = results[0].id;
          console.log(`STUDENT ID FOR ${name} IS ${studentId}`);

          // Insert the student ID and subject IDs into the 'subject_assigned' table
          const insertQuery = 'INSERT INTO subject_assigned (student_id, subject_id) VALUES (?, ?)';
          const insertPromises = subjects.map((subject) => {
            const getSubjectIdQuery = 'SELECT sub_id FROM subjects WHERE sub_name = ?';
            return new Promise((resolve, reject) => {
              connection.query(getSubjectIdQuery, [subject], (error, results) => {
                if (error) {
                  console.error('Error retrieving subject ID from the SUBJECTS database: ', error);
                  reject(error);
                  return;
                }

                if (results.length === 0) {
                  console.error('Subject not found');
                  reject('Subject not found');
                  return;
                }

                const subjectId = results[0].sub_id;
                console.log(results);
                console.log(`Subject ID for ${subject} is ${subjectId}`);

                connection.query(insertQuery, [studentId, subjectId], (error, results) => {
                  if (error) {
                    console.error('Error inserting data into the SUBJECT ASSIGNED database: ', error);
                    reject(error);
                    return;
                  }

                  console.log('Data inserted successfully');
                  resolve();
                });
              });
            });
          });

          Promise.all(insertPromises)
            .then(() => {
              resolve();
            })
            .catch((error) => {
              reject(error);
            });
        });
      });
    });

    Promise.all(insertPromises)
      .then(() => {
        res.status(200).send
        res.status(200).redirect("/home");
      })
      .catch((error) => {
        res.status(500).send('Error inserting data into the database');
      });
  });
}); 

module.exports = router;