var express = require('express');
var db = require('./db');
var url = require('url');
var CryptoJS = require("crypto-js");
var owasp = require('owasp-password-strength-test');
var router = express.Router();


router.get('/password',function (req,res,next) {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    var q = url.parse(fullUrl,true);
    var data = q.query;
    var email = data.email;
    var token = data.token;
    var id =decodeURIComponent(data.id);


    tokenControl = function (result) {
        var string=JSON.stringify(result);
        var json =  JSON.parse(string);
        var tokken = (json[0].token).toString();
        return tokken;
      };


    idDecrypt = function (id) {
        var bytes  = CryptoJS.AES.decrypt(id, 'evren1numara');
        var plaintext = bytes.toString(CryptoJS.enc.Utf8);
        return plaintext;
    };
    db.query("SELECT * FROM users WHERE email=? and id =?",[email,idDecrypt(id)],function (err,result){
        if (err){
            res.send({code: 400, message:"db hatası kardo"});
        }
        else if (result.length==1){
            db.query("SELECT id FROM users where email=?",[email],function (err,result) {
                var string=JSON.stringify(result);
                var json =  JSON.parse(string);
                var uid = (json[0].id);
                var gelenid=idDecrypt(id);



                if (uid==gelenid){
                    db.query("SELECT token FROM change_password WHERE user_id=?",[uid],function (err,result) {
                        if (err){
                            return res.send({code: 400, message:" db error"});
                        }
                        else {
                            var gelentoken=tokenControl(result);
                            if(gelentoken==token){
                                //şifre değiştirme ekranı getir.
                                //yeni şifre insert edildiğinde tokenı patetes et.
                                //token için geçerli bir süre belirle.

                                   res.render('changepassword_form',{url:fullUrl});
                                   next()

                            }
                            else {
                                return  res.send({code: 400, message:"token uyuşmazlık"});
                            }
                        }
                    });


                }
                else {
                   return res.send({code:400 , message:"id uyuşmazlık"});
                }

            });

        }
        else {
            return res.send({code:400 , message:"kayıt bulunamadı"});
        }


});
});


router.post('/test',function (req,res) {
    console.log(req.body);
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    var q = url.parse(fullUrl,true);
    var data = q.query;
    var email = data.email;
    var id = decodeURIComponent(data.id);
    var bytes  = CryptoJS.AES.decrypt(id, 'evren1numara');
    var plaintext = bytes.toString(CryptoJS.enc.Utf8);
    console.log(plaintext);
    var password = req.body.password;
    var confirm_password = req.body.cpassword;
    console.log(password);
    owasp.config({
        allowPassphrases       : false,
        maxLength              : 16,
        minLength              : 8,
        minPhraseLength        : 20,
        minOptionalTestsToPass : 4,
    });
    if(password==confirm_password){
        var result = owasp.test(password);
        if(result['errors'].length==0){
            // db.query("UPDATE users SET password=? where email=?, id=?"[email,plaintext])
             return res.end('KAYIT BAŞARILI');
        }
        else {
            //kurallar tekrardan gözden geçirilecek...
            //frontend tarafı ayarlanıcak...
            for (var i=0; i<result['errors'].length; i++){
                    res.end(result['errors'][i]);
            }
        }



    }
    else {
        console.log("fsjdkf");
        res.redirect('/change/password');

    }
});

module.exports = router;