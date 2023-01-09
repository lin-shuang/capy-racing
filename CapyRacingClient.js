//set public path
const path = require("path");
let publicPath = path.resolve(__dirname, "public");

//initialize express client
const express = require("express");
let app = express();
app.use(express.static(publicPath));
app.listen(3000, () => console.log("Starting up Capy Racing client"));

