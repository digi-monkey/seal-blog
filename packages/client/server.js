const express = require("express");
const path = require("path");
require("dotenv").config();

const envConfig = {
  mode: process.env.REACT_APP_MODE,
  networkType: process.env.REACT_APP_BLOCKCHAIN_NETWORK,
  siteTitle: process.env.REACT_APP_SITE_TITLE,
  siteDescription: process.env.REACT_APP_SITE_DESCRIPTION,
};

console.log(envConfig);

const app = express();

const port = process.env.PORT || "3000";

app.use(express.static(path.join(__dirname, "build")));

app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(port, () => console.log(`listening at port ${port}..`));
