var express = require('express');
var db = require('./db');
var router = express.Router();

router.post("/api/v1/post",function (req, res) {
    var data = req.body;
    console.log(data);
var Name= req.body.uname;
var Surname = req.body.usurname;
var Email = req.body.uemail;

    db.query("INSERT INTO user(uName, uSurname, uEmail) VALUES(?,?,?)", [Name, Surname, Email], function (err,result) {
    if (err){
        return res.send({code: 400, message:"db hatası"})
    }
    var uid= result.insertId;
    return res.send({code: 200, message:"kayıt başarılı"})
});
});
module.exports = router;
