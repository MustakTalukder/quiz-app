const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const registrationValidator = require("../validators/registrationValidator");
const loginValidator = require("../validators/loginValidator");
const { catchError } = require("../utils/error");
const { PENDING, ACTIVE } = require("../utils/accountStatus");
const verificationTemplate = require("../emailTemplates/verificationTemplate");
const welcomeTemplate = require("../emailTemplates/welcomeTemplates");

const generateEmailOption = require("../utils/generateEmailOption");
const transporter = require("nodemailer");

module.exports = {
  async register(req, res) {
    const { name, email, password, confirmPassword } = req.body;
    var result = registrationValidator({
      name,
      email,
      password,
      confirmPassword
    });

    if (!result.isValid) {
      res.status(400).json(result.error);
    } else {
      try {
        const findUser = await User.findOne({ email });
        if (findUser) {
          return res.status(400).json({
            message: "Email Already Exist"
          });
        }

        // Json web token
        const activateToken = jwt.sign({ name, email }, process.env.SECRET, {
          expiresIn: "1d"
        });

        bcrypt.hash(password, 11, async (error, hash) => {
          if (error) return catchError(res, error);

          let user = new User({
            name,
            email,
            password: hash,
            accountStatus: PENDING,
            isActivated: false,
            activateToken
          });

          const newUser = await user.save();

          // Generate Email Option
          let activateLink = `http://localhost:4000/api/users/activateaccount/${
            newUser.activateToken
          }`;
          let template = verificationTemplate({
            name: newUser.name,
            link: activateLink
          });
          let mailOption = generateEmailOption({
            to: newUser.email,
            subject: "Activate Your Account",
            template
          });

          transporter.sendMail(mailOption, (err, info) => {
            if (err) return catchError(res, err);

            res.status(201).json({
              message: "USer Created Successfully, Check Your Email to Verify",
              user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email
              }
            });
          });
        });
      } catch (error) {
        return catchError(res, error);
      }
    }
  },

  // Activate Account

  async activateAccount(req, res) {
    const token = req.params.token;
    const decode = jwt.verify(token, process.env.SECRET);

    if (!decode) {
      return catchError(res, new Error("Invalid Token"));
    }

    try {
      const user = await User.findOne({ email: decode.email });
      if (!user) {
        return catchError(res, new Error("Invalid Token"));
      }

      if (user.isActivated) {
        return catchError(res, new Error("Already Activated"));
      }
      if (user.activateToken === token) {
        const updatedUser = await findOneAndUpdate(
          { email: decode.email },
          {
            $set: {
              accountStatus: ACTIVE,
              isActivated: true,
              activateToken: ""
            }
          }
        );

        // Welcome Template
        let template = welcomeTemplate({
          name: updatedUser.name,
          link: "http://localhost/4000"
        });
        let mailOption = generateEmailOption({
          to: updatedUser.email,
          subject: "Welcome",
          template
        });

        transporter.sendMail(mailOption, (err, info) => {
          if (err) return catchError(res, err);
          console.log(JSON.stringify(info, 2));

          res.status(200).json({
            message: "Account Activated",
            user: {
              _id: updatedUser._id,
              email: updatedUser.email
            }
          });
        });
      } else {
        res.status(400).json({
          message: "Token Invalid"
        });
      }
    } catch (error) {
      return catchError(res, error);
    }
  },

  async login(req, res) {
    let { email, password } = req.body;
    let result = loginValidator({ email, password });

    if (!result.isValid) {
      return res.status(400).json(result.error);
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User Not Found"
      });
    }

    bcrypt.compare(password, user.password, (err, match) => {
      if (err) return catchError(res, err);
      if (!match) return res.status(400).json({ message: "Invalid Password" });

      let token = jwt.sign(
        {
          _id: user._id,
          email: user.email,
          name: user.name
        },
        process.env.SECRET
      );

      return res.status(200).json({
        message: "Login Successful",
        token: `Bearer ${token}`
      });
    });
  },

  async getAllUsers(req, res) {
    const users = await User.find();
    res.json(users);
  },

  async removeUser(req, res) {
    let { id } = req.params;
    try {
      await User.findByIdAndDelete(id);
      res.status(200).json({
        message: "User Deleted Successfully"
      });
    } catch (err) {
      return catchError(res, err);
    }
  }
};
