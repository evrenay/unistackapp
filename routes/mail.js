var express = require('express');
var db = require('./db');
var CryptoJS = require("crypto-js");
var nodemailer = require('nodemailer');
var url = require('url');
var router = express.Router();

router.get('/again/register',function (req,res)  {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    var q = url.parse(fullUrl,true);
    var data = q.query;
    var email = data.email;
    console.log(email);
    idCrypo = function (id) {
        var ciphertext = CryptoJS.AES.encrypt(id, 'evren1numara');
        return ciphertext;
    };
    timer = function (id) {
        setTimeout(function () {
            db.query("UPDATE users SET spam=? WHERE id=?",[0,id],function (err,result) {
                if (err){
                    return res.send({code:400, message:"db hatasııı"});
                }
                else {
                    console.log("spam pasif");
                    task.destroy();

                }
            });
        },300000);
    };
    db.query("SELECT * FROM users WHERE email=?",[email],function (err,result) {

        if (err){
            return res.send({code: 400, message:" db hatası bro"});
        }
        else if(result.length==0){
            return res.send({code: 400, message:"mail kayıtlı değil"});
        }
        else if(result.length==1){
            var spam = result[0].spam;
            if (spam==1){
                res.send({code: 400, message:"Mailiniz yollanmıştır...Mail gelmediyse 5 dakika sonra tekrar deneyin..."})
            }
            else {
                var activation_Code =  result[0].activation_code;
                var user_id= result[0].id;
                var link="http://"+req.get('host')+"/deneme/verify?id="+activation_Code+"&u="+encodeURIComponent(idCrypo((user_id).toString()));
                var transporter = nodemailer.createTransport({
                    service: 'yandex',
                    host: 'smtp.yandex.com.tr',
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'activate@unistackapp.com',
                        pass: '123654...'
                    }
                });
                var mailOptions = {
                    from: 'activate@unistackapp.com',
                    to: email,
                    subject: 'Please confirm your Email account',
                    html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
                };
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        return res.send({code: 400, error:"Mail gönderilirken bir hata oluştu..."});
                    }
                    else {
                        db.query("UPDATE users SET spam=? WHERE id=?",[1,user_id],function (err,result) {
                        if(err){
                            return res.send({code: 400, error:"dbb"});
                        }
                        else {
                            console.log("spam aktif");
                            timer(user_id);
                            return res.send({code: 200, message:"Mail başarılı bir şekilde gönderildi..."});
                        }
                    });

                    }
                });

            }

        }

    });

});





module.exports=router;