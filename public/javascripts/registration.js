$(document).ready(function() {
    $("#register").click(function() {
        var password = $("#password").val();
        var cpassword = $("#cpassword").val();
        if (password == '' || cpassword == '') {
            alert("Please fill all fields...!!!!!!");
        } else if ((password.length) < 8) {
            alert("Password should atleast 8 character in length...!!!!!!");
        } else if (!(password).match(cpassword)) {
            alert("Your passwords don't match. Try again?");
        }
        else {
            alert("Registration Succesful");
        }
    });
});