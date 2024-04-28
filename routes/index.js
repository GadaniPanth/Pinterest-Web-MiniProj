var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./posts');
const passport = require('passport');
const localStrategy = require('passport-local');
const upload = require('./multer')

passport.use(new localStrategy(userModel.authenticate()));

router.get('/', function(req, res, next) {
  res.render('index', {fail: req.flash("error")});
});

router.get('/register', function(req, res, next) {
  res.render('register', {fail: false})
});

router.post('/register', function(req, res, next) {
  const data = new userModel({
    name: req.body.name,
    username: req.body.username,
    email: req.body.email,
    contact: req.body.contact,
  })

  userModel.register(data, req.body.password)
    .then(()=>{
      passport.authenticate("local")(req, res, function(){
        return res.redirect("/profile");
      })
    })
    .catch((e)=>{
      // console.log(e.name)
      // console.log((e.message.substring(e.message.indexOf('{')+1,e.message.indexOf('}')).split(':')[0]).trim())
      let error = (e.message.substring(e.message.indexOf('{')+1,e.message.indexOf('}')).split(':')[0]).trim()
      if(e.name === 'UserExistsError'){
        fail='User Name Already Exists'
      }else if(error == 'email'){
        fail='Email Already Exists'
      }else{
        fail='Contact Already Exists'
      }
      return res.render("register", {fail: fail})
    })
});

router.post('/login', passport.authenticate("local", {
  successRedirect: "/profile",
  failureFlash: true,
  failureRedirect: "/"
}),(req, res, next)=>{})

router.get('/logout',(req, res, next)=>{
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})

router.get('/profile', isLoggedIn, async (req, res, next)=>{
  const user= 
    await userModel
      .findOne({username: req.session.passport.user})
      .populate("posts")
  console.log(user)
  res.render('profile' ,{user});
})

router.get('/show/posts', isLoggedIn, async (req, res, next)=>{
  const user=
    await userModel
      .findOne({username: req.session.passport.user})
      .populate("posts")
  console.log(user)
  res.render('show' ,{user});
})

router.get('/feed', isLoggedIn, async (req, res, next)=>{
  const user = await userModel.findOne({username: req.session.passport.user})
  const posts = await postModel.find()
  .populate("user")
  
  res.render("feed",{posts, user})
})

router.post('/fileupload', isLoggedIn, upload.single("image"), async (req, res, next)=>{
  const user= await userModel.findOne({username: req.session.passport.user})
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect('/profile');
})

router.get('/add', isLoggedIn, async (req, res, next)=>{
  const user= await userModel.findOne({username: req.session.passport.user})
  res.render('add' ,{user});
})

router.post('/createpost', isLoggedIn, upload.single("postimage"), async (req, res, next)=>{
  if(!req.file){
    return res.status(404).send("no files were given");
  }
  const user= await userModel.findOne({username: req.session.passport.user})
  const postData = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  });

  user.posts.push(postData._id);
  await user.save();
  res.redirect('/profile');
})

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
}

module.exports = router;
