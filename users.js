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
let isTeacher = false;
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).render("login", {
        msg: "Please Enter Your Email and Password",
        msg_type: "error",
      });
    }
    console.log(req.body);
    db.query(
      "select * from users where email=?",
      [email],
      async (error, result) => {
        console.log(result);
        if (result.length <= 0) {
          return res.status(401).render("login", {
            msg: "Please Enter Your Email and Password",
            msg_type: "error",
          });
        } else {
          if (!(await bcrypt.compare(password, result[0].password))) {
            return res.status(401).render("login", {
              msg: "Please Enter Your Email and Password",
              msg_type: "error",
            });
          } else {
            const id = result[0].ID;
           // let isTeacher = false;
            if(result.length>0){const isTeacher = result[0].is_teacher;
            console.log("retreiving is teacher --"+isTeacher);
            }
            const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
              expiresIn: process.env.JWT_EXPIRES_IN,
            });

            console.log("The Token is " + token);
            //console.log("The result is "+result);
           
            const cookieOptions = {
              expires: new Date(
                Date.now() +
                  process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
              ),
              httpOnly: true,
            };

            if (result[0].is_teacher) {
              res.cookie("joes", token, cookieOptions);
              console.log("isteacher ------ true");
              const teacherId = result[0].id;
              res.status(200).redirect(`/dashboard?id=${teacherId}`);// Redirect to the teacher dashboard
            }
            else{
            res.cookie("joes", token, cookieOptions);
            console.log("isteacher ------ false");
            const studentId = result[0].id;
            console.log("studentID is",studentId);
           // res.status(200).redirect(`/assignment?id=${studentId}`);
           res.status(200).redirect('/home');
            }
          }
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
exports.register = (req, res) => {
  console.log(req.body);
  /*
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const confirm_password = req.body.confirm_password;
  console.log(name);
  console.log(email);
    //res.send("Form Submitted");
  */
  const { name, email, password, confirm_password,is_teacher} = req.body;
  console.log("name is "+ req.body.name);
  console.log("isteacher from req "+req.body.is_teacher);
  db.query(
    "select email from users where email=?",
    [email],
    async (error, result) => {
      if (error) {
        console.log(error);
      }

      if (result.length > 0) {
        console.log(result);
        return res.render("register", {
          msg: "Email id already Taken",
          msg_type: "error",
        });
      } else if (password !== confirm_password) {
        return res.render("register", {
          msg: "Password do not match",
          msg_type: "error",
        });
      }
      let hashedPassword = await bcrypt.hash(password, 8);
      //console.log(hashedPassword);
      let teacher=0;
      console.log("isteacher is "+is_teacher);
      if(is_teacher){teacher=1;} else{teacher=0;}
      console.log("after if condition"+teacher);
      db.query(
        "insert into users set ?",
        { name: name, email: email, password: hashedPassword,is_teacher:teacher},
        (error, result) => {
          if (error) {
            console.log(error);
          } else {
            console.log(is_teacher);
            console.log(result);
            return res.render("register", {
              msg: "User Registration Success",
              msg_type: "good",
            });
          }
        }
      );
    }
  );
};

// exports.isLoggedIn = async (req, res, next) => {
//   req.name = "Check Login....";
//   //console.log(req.cookies);
//   if (req.cookies.joes) {
//     try {
//       const decode = await promisify(jwt.verify)(
//         req.cookies.joes,
//         process.env.JWT_SECRET
//       );
//       //console.log(decode);
//       db.query(
//         "select * from users where id=?",
//         [decode.id],
//         (err, results) => {
//           //console.log(results);
//           if (!results) {
//             return next();
//           }
//           req.user = results[0];
//           return next();
   

//         }
//       );
//     } catch (error) {
//       console.log(error);
//       return next();
//     }
//   } else {
//     next();
//   }
// };

exports.isLoggedIn = async (req, res, next) => {
  req.name = "Check Login....";
  
  if (req.cookies.joes) {
    try {
      const decode = await promisify(jwt.verify)(
        req.cookies.joes,
        process.env.JWT_SECRET
      );

      db.query(
        "SELECT * FROM users WHERE id = ?",
        [decode.id],
        (err, results) => {
          if (err) {
            console.log(err);
            return next();
          }

          if (results.length === 0) {
            return next();
          }

          req.user = results[0];
          console.log("inside isLoggedIn", results);
          return next();
        }
      ); 
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    next();
  }
};



exports.logout = async (req, res) => {
  res.cookie("joes", "logout", {
    expires: new Date(Date.now() + 2 * 1000),
    httpOnly: true,
  });
  res.status(200).redirect("/");
};

exports.display = async (req, res) => {
  res.render("display_time",req.body);
  console.log(req.body);
};

exports.quiz = async (req,res) => {
  res.render("quiz",req.body);console.log("inside exports quiz");
  console.log(req.body);
};
