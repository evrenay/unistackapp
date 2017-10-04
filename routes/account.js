var express = require('express');
var db = require('./db');
var passwordHash = require('password-hash');
var CryptoJS = require("crypto-js");
var randomstring = require("randomstring");
var url = require('url');
var router = express.Router();


router.get('/verify',function(req,res){
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    var q = url.parse(fullUrl,true);
    var data = q.query;
    var id = data.id;
    var uid =decodeURIComponent(data.u);


    console.log(typeof uid);
    console.log(decodeURIComponent(uid));
    var bytes  = CryptoJS.AES.decrypt(uid, 'evren1numara');
    var plaintext = bytes.toString(CryptoJS.enc.Utf8);
    console.log(plaintext);
        db.query("SELECT activation_status,activation_code FROM users WHERE id =?",[plaintext],function (err,result) {
            if (err){

                return res.send({code: 400, message:" db hatası bro"});
            }
            else if(result.length==0){
                res.end("<h1>HESAP BULUNAMADI...</h1>");
            }
            else {
                console.log(result);
               var activation_status =  result[0].activation_status;


                if (activation_status == 1){
                    res.end("<h1>HESABINIZ SUANDA AKTiF HALDE...</h1>");
               }


               else {
                   db.query("SELECT * FROM users WHERE activation_code=? and id=?",[id,plaintext],function (err,result) {
                       if (err){

                           return res.send({code: 400, message:" db hatası bro"});
                       }
                       else if(result.length==1)
                       {   var newactivation_code = randomstring.generate(15);
                       console.log(newactivation_code);
                           db.query("UPDATE users SET activation_status=?, activation_code=? WHERE id=?",[1,newactivation_code,plaintext],function (err,result) {
                               if (err){
                                   return res.send({code: 400, message:"db sıçmış bro"});
                               }
                               else {
                                   res.end("<h1>HESABiNiZ AKTiF EDiLDi...</h1>");
                               }
                           });



                       }
                       else
                       {
                           res.end("<h1>HESABINIZ AKTiF EDiLEMEDi...</h1>");
                       }
                   })

               }



            }
        });
});

router.post("/login",function (req,res) {
    var data = req.body;
    console.log(data);
    var email = req.body.email;
    var password = req.body.password;
    db.query("SELECT * FROM users WHERE email=?",[email],function (err,result) {
        if(err){
            res.send({code:400,error:"db hatası"});
        }
        else if(result.length==1){
            var hashedPassword = result[0].password;
            var statusPassword = passwordHash.isHashed(hashedPassword);
            var verifyPassword = passwordHash.verify(password,hashedPassword);
            if(verifyPassword== true && statusPassword== true){
                var userType = result[0].user_type;
                if(userType == 0 ){
                    var activationStatus = result[0].activation_status;
                    if(activationStatus == 0){
                        res.send({code:301, message:"hesap aktif değil ve öğrenci"});
                    }
                    else if(activationStatus == 1){
                        res.send({code:201, message:"login başarılı öğrenci"});
                    }

                }
                else if(userType == 1){
                    var activationStatus = result[0].activation_status;
                    if(activationStatus == 0){
                        res.send({code:302, message:"hesap aktif değil ve hoca"});
                    }
                    else if(activationStatus == 1){
                        res.send({code:202, message:"login başarılı hoca"});
                    }
                }
            }
            else {
                res.send({code:400, error:"şifre yanlış"});
            }


        }
        else {
            res.send({code:400, error:"bu mailde bir hesap bulunamadı."});
        }
    });

});


module.exports = router;