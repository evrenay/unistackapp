var express = require('express');
var db = require('./db');
var router = express.Router();

router.post("/api/v1/post",function (req, res) {
var Name= req.body.Name;
var Surname = req.body.Surname;
var Email = req.body.Email;


db.query("INSERT INTO User(Name, Surname, Email) VALUES(?,?,?)",[Name,Surname,Email],function (err,result) {
    if (err){
        return res.send({code: 400, message:"db hatası"})
    }
    var uid= result.insertId;
    return res.send({code: 200, message:"kayıt başarılı"})
});
});
module.exports = router;
