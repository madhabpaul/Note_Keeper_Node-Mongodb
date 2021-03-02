var express = require('express');
var router = express.Router();
var userModel = require('../module/user');
var categoryModel = require('../module/category');
var messageModel = require('../module/addMessage');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const { count } = require('../module/user');
var getcategory = categoryModel.find({});


if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}



/* Token Check */
function checkLoginUser(req, res, next){

  var userToken=localStorage.getItem('userToken');
  try{
    var decoded = jwt.verify(userToken, 'loginToken');
  } catch(err){
    res.redirect('/');
  }
  next();
}




/* Check if email is exist in database */
function checkEmail(req, res, next){
  var email = req.body.email;
  var chechExistEmail = userModel.findOne({email: email});
  chechExistEmail.exec((err, data) => {
    if(err) throw err;
    if(data){
      return res.render('signUp', { title: 'Sign Up', msg:'Email Already Exist' });
    }
    next();
  })
}




/* Check if username is exist in database */
function checkuserName(req, res, next){
  var username = req.body.userName;
  var chechExistUserName = userModel.findOne({username: username});
  chechExistUserName.exec((err, data) => {
    if(err) throw err;
    if(data){
      return res.render('signUp', { title: 'Sign Up', msg:'Username Already Exist' });
    }
    next();
  })
}





/* GET home/login page. */
router.get('/', function(req, res, next) {
  var loggedUser = localStorage.getItem('loginUser');
  if(loggedUser){
    res.redirect('/dashboard')
  }else{
    res.render('index', { title: 'Login', msg:'' });
  }
});




/* POST home/login page. */
router.post('/', function(req, res, next) {

  var username = req.body.userName;
  var password = req.body.password;
  var checkUserName = userModel.findOne({username: username});
  checkUserName.exec((err, data)=> {
    var getUserId = data._id;
    var getPassword = data.password;
    if(err) throw err; 
    if(bcrypt.compareSync(password, getPassword)){
      var token = jwt.sign({ userId: getUserId}, 'loginToken');
      localStorage.setItem('userToken', token);
      localStorage.setItem('loginUser', username);
      res.redirect('/dashboard');
    }else{
      res.render('index', { title: 'LogIn', msg:'User Loggged In Unsuccessfuly' });
    }
    
  })
});

/* GET logout page. */
router.get('/logout', function(req, res, next) {
  localStorage.removeItem('userToken');
  localStorage.removeItem('loginUser');
  res.redirect('/');
});





/* GET dashboard page. */
router.get('/dashboard', checkLoginUser, function(req, res, next) {
  var loggedUser = localStorage.getItem('loginUser');
  res.render('dashboard', { title: 'Dashboard', loggedUser: loggedUser, msg:'' });
});





/* GET sign up page. */
router.get('/signup', function(req, res, next) {
  var loggedUser = localStorage.getItem('loginUser');
  if(loggedUser){
    res.redirect('/dashboard')
  }else{
    res.render('signUp', { title: 'Sign Up', msg:'' });
  }
});

/* POST sign up page. */
router.post('/signup', checkuserName, checkEmail, function(req, res, next) {

  var username = req.body.userName;
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var cpassword = req.body.confirmPassword;

  if(password != cpassword){
      res.render('signUp', { title: 'Sign Up', msg:'Password Not Match' });
  }else{
    password = bcrypt.hashSync(password, 10);
    var userSignUp = new userModel({
      username: username,
      name: name,
      email: email,
      password: password
    });
  
    userSignUp.save((err, data)=> {
      if(err) throw err;
      res.render('signUp', { title: 'Sign Up', msg:'User Register Successfully' });
    });
  } 
});





/* GET category page. */
router.get('/category', checkLoginUser, function(req, res, next) {
  var loggedUser = localStorage.getItem('loginUser');
  var query = {};
  var options = {
    sort: { date: -1 },
    offset: 0,
    limit: 5,
  };
  categoryModel.paginate(query, options).then(function (result){
    console.log(result);
    res.render('category', { title: 'Category', loggedUser: loggedUser, results:result.docs, current: result.page, pages: result.totalPages });
  });
});

/* GET category pagination page. */
router.get('/category/:page', checkLoginUser, function(req, res, next) {
  var loggedUser = localStorage.getItem('loginUser');
  var perPage = 5;
  var page = req.params.page || 1;
  categoryModel.find({})
    .skip((perPage * page) - perPage)
    .sort({ date: -1 })
    .limit(perPage).exec((err, data) => {
      if(err) throw err;
      messageModel.countDocuments({}).exec((err, count) => {
      res.render('category', { title: 'Category', loggedUser: loggedUser, current: page, results: data, success:'', pages: Math.ceil(count / perPage) });
      });
    });
});




/* GET category edit page. */
router.get('/category/edit/:id', checkLoginUser, function(req, res, next) {
  var loggedUser = localStorage.getItem('loginUser');
  var categoryID = req.params.id;
  categoryModel.findById(categoryID, (err, data)=>{
    if(err) {
      console.log(err)
    }else{
      res.render('editCategory', { title: 'Edit category', loggedUser: loggedUser, results:data, id:categoryID });
    }
  });
});

/* POST category edit page. */
router.post('/category/edit/', checkLoginUser, function(req, res, next) {
  var loggedUser = localStorage.getItem('loginUser');
  var categoryID = req.body.id;
  var categoryName = req.body.categoryName;
  categoryModel.findByIdAndUpdate(categoryID, {
    categoryName: categoryName
  }, (err, data)=>{
    if(err) {
      console.log(err)
    }else{
      res.redirect('/category');
    }
  });
});




/* GET category delete page. */
router.get('/category/delete/:id', checkLoginUser, function(req, res, next) {
  var loggedUser = localStorage.getItem('loginUser');
  var categoryID = req.params.id;
  console.log(categoryID);
  var categoryDelete = categoryModel.findByIdAndDelete(categoryID);
  
  categoryDelete.exec((err, data)=>{
    if(err) throw err;
    
    res.redirect('/category');
  })
});





/* GET add new category page. */
router.get('/addNewCategory', checkLoginUser,  function(req, res, next) {
  var loggedUser = localStorage.getItem('loginUser');
  res.render('addNewCategory', { title: 'Add New Category', loggedUser: loggedUser, errors:'', success:'' });
});

/* POST add new category page. */
router.post('/addNewCategory', checkLoginUser, [ check('categoryName','Enter Category').isLength({ min: 1 })], function(req, res, next) {
  var loggedUser = localStorage.getItem('loginUser');
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    res.render('addNewCategory', { title: 'Add New Category', loggedUser: loggedUser,  errors:errors.mapped(), success:'' });
  }else{
    var category = req.body.categoryName;
    var categoryDetail = new categoryModel({
      categoryName: category
    });
    categoryDetail.save((err, data)=>{
      if(err) throw err;
      res.render('addNewCategory', { title: 'Add New Category', loggedUser: loggedUser,  errors:'', success:'Category Added Successfully' });
    });
  }
  
});





/* GET add new message page. */
router.get('/addNewMessage', checkLoginUser, function(req, res, next) {
  var loggedUser = localStorage.getItem('loginUser');
  getcategory.exec((err, data)=> {
    if(err) throw err;
    res.render('addNewMessage', { title: 'Add New Category', loggedUser: loggedUser, record:data, success:'' });
  })
});

/* POST add new message page. */
router.post('/addNewMessage', checkLoginUser, function(req, res, next) {
  var loggedUser = localStorage.getItem('loginUser');
  
  var cOption = req.body.categoryOption;
  var message = req.body.message;

  var messageSave = new messageModel({
    categoryOption: cOption,
    message: message
  });
   messageSave.save((err, data)=>{
    if(err) throw err;
    res.redirect('/viewMessage');
   })
});





/* GET view message page. */
router.get('/viewMessage/', checkLoginUser, function(req, res, next) {
  var loggedUser = localStorage.getItem('loginUser');
  var perPage = 2;
  var page = req.params.page || 1;
  messageModel.find({})
    .skip((perPage * page) - perPage)
    .limit(perPage).exec((err, data) => {
      if(err) throw err;
      messageModel.countDocuments({}).exec((err, count) => {
      res.render('viewMessage', { title: 'View Message', loggedUser: loggedUser, current: page, results: data, success:'', pages: Math.ceil(count / perPage) });
      });
    });
});

/* GET view message pagination page. */
router.get('/viewMessage/:page', checkLoginUser, function(req, res, next) {
  var loggedUser = localStorage.getItem('loginUser');
  var perPage = 2;
  var page = req.params.page || 1;
  messageModel.find({})
    .skip((perPage * page) - perPage)
    .limit(perPage).exec((err, data) => {
      if(err) throw err;
      messageModel.countDocuments({}).exec((err, count) => {
      res.render('viewMessage', { title: 'View Message', loggedUser: loggedUser, current: page, results: data, success:'', pages: Math.ceil(count / perPage) });
      });
    });
});

/* GET message edit page. */
router.get('/viewMessage/edit/:id', checkLoginUser, function(req, res, next) {
  var loggedUser = localStorage.getItem('loginUser');
  var messageID = req.params.id;
  messageModel.findById(messageID, (err, data)=>{
    if(err) {
      console.log(err)
    }else{
      res.render('editMessage', { title: 'Edit category', loggedUser: loggedUser, results:data, id:messageID });
    }
  });
});

/* POST message edit page. */
router.post('/viewMessage/edit/', checkLoginUser, function(req, res, next) {
  var loggedUser = localStorage.getItem('loginUser');
  var messageID = req.body.id;
  var categoryOption = req.body.categoryOption;
  var message = req.body.message;
  messageModel.findByIdAndUpdate(messageID, {
    categoryOption: categoryOption,
    message: message
  }, (err, data)=>{
    if(err) {
      console.log(err)
    }else{
      res.redirect('/viewMessage');
    }
  });
});




/* GET message delete page. */
router.get('/viewMesage/delete/:id', checkLoginUser, function(req, res, next) {
  var loggedUser = localStorage.getItem('loginUser');
  var categoryID = req.params.id;
  var categoryDelete = messageModel.findByIdAndDelete(categoryID);
  
  categoryDelete.exec((err, data)=>{
    if(err) throw err;
    
    res.redirect('/category');
  })
});


module.exports = router;
