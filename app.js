const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(app.use(bodyParser.json()));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server started on ${PORT}`);
  mongoose.connect(
    "mongodb://localhost:27017/quiz-app",
    { useNewUrlParser: ture },
    () => {
      console.log("Database running");
    }
  );
});
