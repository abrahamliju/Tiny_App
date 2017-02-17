let express = require("express");
let app = express();
let PORT = process.env.PORT || 8080; // default port 8080
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
var bcrypt = require("bcrypt");
const saltRounds = 10;

function generateRandomString() {
  let text = "";
  let charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( let i=0; i < 6; i++ )
      text += charset.charAt(Math.floor(Math.random() * charset.length));
    return text;
}

function checkUrlsinObj(urlObj, shortUrl) {
  for(let email in urlObj){
    for(let shUrl in urlObj[email]){
      if(shortUrl === shUrl){
        return true;
      }
    }
  }
  return false;
}

let urlDatabase = {

};

let users = {


};

app.get("/register", (req, res) => {
  if(req.session.cookieId){
    res.redirect("/");
  } else {
      res.status(200).render("urls_register");
  }
});

app.post("/register", (req, res) => {
  if(req.body.username in users){
    res.status(400).send("User already exists. Please login <a href ='/login'>Click Here</a>")
  }
  if(req.body.password === "" || req.body.username === ""){
    res.status(400).send("Please enter a Valid Email Address and Password");
  }
  if(!(users[req.body.username])){
    req.session.cookieId = req.body.username;
    users[req.body.username] = {};
    users[req.body.username] = {email: req.body.username, passWord: bcrypt.hashSync(req.body.password, saltRounds) };
    res.redirect("/urls");
  } else {
      users[req.body.username] = {email: req.body.username, passWord: bcrypt.hashSync(req.body.password, saltRounds)};
      res.redirect("/urls");
  }
  console.log(users);
});

app.post("/logout", (req, res) => {
  req.session = null
  res.redirect("/");
});

app.get("/login", (req, res) => {
  if(req.session.cookieId){
    res.redirect("/");
  } else {
    res.status(200).render("urls_login")
  }
});

app.post("/login", (req, res) => {
  if(users[req.body.username] && bcrypt.compareSync(req.body.password, users[req.body.username].passWord)   ) {
    req.session.cookieId = req.body.username;
    res.redirect("/urls");
    console.log("Logged")
  }else {
    res.status(401).send("Username or Password does not match");
  }
});

app.get("/urls",(req, res) => {
  if(req.session.cookieId){
    let templateVars = { urls: urlDatabase[req.session.cookieId],
                         userId: req.session.cookieId
                       };
    res.status(200).render("urls_index", templateVars);
  } else {
      res.status(401).send("Please Login <a href ='/login'>Click Here</a>");
  }
});

app.get("/urls/new", (req, res) => {
  if(req.session.cookieId){
    let templateVars = {};
    templateVars.userId = req.session.cookieId;
    res.status(200).render("urls_new", templateVars);
  } else {
    res.status(401).send("Please login <a href ='/login'>Click Here</a> ")
  }
});

app.get("/urls/:id", (req, res) => {
  let shortUrl = req.params.id;
  if(req.session.cookieId){
    if(checkUrlsinObj(urlDatabase, shortUrl)){
      if(req.params.id in urlDatabase[req.session.cookieId]){
        let longUrl = urlDatabase[req.session.cookieId][shortUrl];
        let templateVars = {}
        templateVars.shortUrl = shortUrl;
        templateVars.longUrl = longUrl;
        templateVars.userId = req.session.cookieId;
        res.render("urls_show", templateVars);
      } else {
          res.status(403).send("The short Url was not created by you")
      }
    } else {
      res.status(404).send("The requested short url does not exist");
    }
  } else {
      res.status(401).send("Please login <a href ='/login'>Click Here</a>")
  }
});

app.post("/urls/create", (req, res) => {
  let shortUrl = generateRandomString();
  let longUrl = req.body.longURL;
  if(req.session.cookieId){
    if(!(urlDatabase[req.session.cookieId])){
      urlDatabase[req.session.cookieId] = {};
      urlDatabase[req.session.cookieId][shortUrl] = longUrl;
    } else {
        urlDatabase[req.session.cookieId][shortUrl] = longUrl;
    }
    console.log(urlDatabase);
    res.redirect("/urls");
  } else {
    res.status(401).send("Please login to make changes <a href ='/login'>Click Here</a>")
  }
});

app.get("/u/:shortURL", (req, res) => {
  let found = false;
  let longURL = "";
  for(let key in urlDatabase){
    for(let url in urlDatabase[key]){
      if(url === req.params.shortURL){
        longURL = urlDatabase[key][url]
        found = true;
        console.log(urlDatabase)
        console.log(longURL);
      }
    }
  }
  if(found){
    res.redirect(longURL);
  } else {
    res.status(404).send("The short url does not exist");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortUrl = req.params.shortURL;
  delete urlDatabase[req.session.cookieId][shortUrl];
  console.log(urlDatabase);
  res.redirect("/urls");
});

app.post("/urls/:shortURL/update", (req, res) => {
  let shortUrl = req.params.shortURL;
  let longUrl = req.body.longURL;
  urlDatabase[req.session.cookieId][shortUrl] = longUrl;
  console.log(urlDatabase);
  res.redirect("/urls")
});

app.get("/", (req,res) => {
  if(req.session.cookieId){
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
