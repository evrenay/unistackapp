var randomstring = require("randomstring");
var nodemailer = require('nodemailer');
var passwordHash = require('password-hash');
var CryptoJS = require("crypto-js");
var express = require('express');

var db = require('./db');
var router = express.Router();


router.post("/register",function (req, res) {
    var data = req.body;
    console.log(data);
    var name= req.body.uname;
    var surname = req.body.usurname;
    var email = req.body.uemail;
    var password = req.body.upassword;

    var hashedPassword = passwordHash.generate(password);
    console.log(hashedPassword);

    var activate_Code = randomstring.generate(15);
    var user_type=0;
    if(!name){
        return res.send({code: 400, error:"Kullanıcı adı eksik" });
    }
    if(!surname){
        return res.send({code: 400, error:"Şifre eksik"});
    }
    if(!email){
        return res.send({code: 400, error:"Email eksik"});
    }
    if(!password){
        return res.send({code: 400, error:"Password Eksik"});
    }
    if (!(email.toLowerCase().endsWith(".edu.tr"))){
        return res.send({code: 400, error: "üniversite maili değil."})
    }
    if((email.toLowerCase().search(".ogr"))== -1){
        user_type=1;
    }
    idCrypoo = function (id) {
        var ciphertext = CryptoJS.AES.encrypt(id.toString(),'evren1numara');
        return ciphertext;
    };
//if exist username ?
    db.query("SELECT * FROM users WHERE email=?",[email],function (err,result) {
        if (result.length == 1){
            res.send({code: 400, error:"Bu email daha önceden alınmış"});
        }
        else {
            db.query("INSERT INTO users(name, surname, email, password, user_type, activation_status, activation_code, spam, created_at) VALUES(?,?,?,?,?,?,?,?,NOW())", [name, surname, email, hashedPassword, user_type, 0, activate_Code,0], function (err,result) {
                if (err){
                    return res.send({code: 400, error:"db hatası"})
                }
                else{
                    var user_id = result.insertId;
                    timer(user_id);


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
                    console.log(user_id);
                    var link="http://"+req.get('host')+"/account/verify?id="+activate_Code+"&u="+encodeURIComponent(idCrypoo(user_id).toString());
                    var mailOptions = {
                        from: 'activate@unistackapp.com',
                        to: email,
                        subject: 'Please confirm your Email account',
                        html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
                    };
                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            return res.send({code: 400, error:"Mail gönderilirken bir hata oluştu..."});
                        } else {
                            db.query("UPDATE users SET spam=? WHERE id=?",[1,user_id],function (err,result) {
                                if (err){
                                    return res.send({code:400, error:"db hatasııı"});
                                }
                                else {
                                    return res.send({code: 200, message:"Mail başarılı bir şekilde gönderildi..."});
                                }
                            });

                        }
                    });





                }
            });}
    });
    timer = function (id) {

        setTimeout(function () {
            var newactivation_code = randomstring.generate(15);
            console.log(newactivation_code);
                db.query("UPDATE users SET activation_code=?,spam=? WHERE id=?",[newactivation_code,0,id],function (err,result) {                 if (err){
                     return res.send({code:400, error:"db hatasııı"});
                 }
                else {
                    console.log("code patates");
                }
           });
        }, 300000)
    };






});

router.post('/password',function (req,res) {
    var email = req.body.email;
    var token = randomstring.generate(15);



    dataInsert = function (id,new_password) {
        console.log(new_password);
        console.log(token);
        console.log(id);
      db.query("INSERT INTO change_password(eposta, user_id, new_password, spam, token, created_at) VALUES(?,?,?,?,?,NOW())",[email, id, new_password, 1, token],function (err,result) {
          if (err){
              return res.send({code: 400, error: "db hatası kardes"});
          }
          else {
              db.query("UPDATE users SET password=? WHERE id=?",[new_password,id],function (err,result) {
                  if (err){
                      return res.send({code: 400, error: "db hatası kardes"});
                  }
                  else{
                      console.log("dbde şifre güncellendi...")
                  }
              });
              console.log("kayıt başarılı...");
          }

      });
    };




    mailSend = function(id,new_password){
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
            html : "Hello,<br> Geçici Şifreniz:  .<br>"+new_password
        };
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                return res.send({code: 400, error:"Mail gönderilirken bir hata oluştu..."});
            } else {
                var hashedPassword = passwordHash.generate(new_password);
                console.log(hashedPassword);
                dataInsert(id,hashedPassword);
                console.log(token);
                timer(token);
                return res.send({code: 200, message:"Mail başarılı bir şekilde gönderildi..."});
            }
        });
    };

    spamControl =function (id,new_pass) {
        db.query("SELECT spam FROM change_password WHERE eposta=?",[email],function (err,result) {
            if(result.length==0){
                mailSend(id,new_pass);
            }
            else if(result.length>=1) {
                var index = (result.length)-1;
                console.log(index);
                var spam = result[index].spam;
                console.log(spam);
                console.log(result);
                if (err){
                    return res.send({code: 400, error: "db hatası kardes"});
                }
                else if(spam==1){
                    return res.send({code: 400, error: "Mail gönderildi...mail gelmedi ise 5 dakika sonra tekrar deneyin"})
                }
                else {

                    mailSend(id,new_pass);

                }

            }
        });
    };

    //Get id from database
    db.query("SELECT * FROM users WHERE email=?",[email],function (err,result) {
        if (err){
            return res.send({code: 400, error: "db hatası kardes"});
        }
        else if (result.length == 1){
                db.query("SELECT id FROM users WHERE email=?",[email],function (err,result)  {
                    var string=JSON.stringify(result);
                    var json =  JSON.parse(string);
                    var id = (json[0].id).toString();
                    var new_password = randomstring.generate(6);
                    console.log(new_password);
                    spamControl(id,new_password);
                });
        }
        else {
            return res.send({code: 400, error:"kullanıcı kaydı bulunamadı"})
        }
    });

    timer = function (token) {
        setTimeout(function () {
            db.query("UPDATE change_password SET spam=? WHERE token=?",[0,token],function (err,result) {
                if (err){
                    return res.send({code:400, error:"db hatasııı"});
                }
                else {
                    console.log("spam pasif");

                }
            });
        },180000);
    };


});

module.exports = router;
