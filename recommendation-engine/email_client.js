const nodemailer = require('nodemailer');
const mail_server = process.env.MAIL_SERVER;
const mail_port = process.env.MAIL_PORT || 587;
const from_address = process.env.FROM_ADDRESS || '';
const subject_line = process.env.SUBJECT_LINE || '';

module.exports.sendTestMessage = function sendMessage(emailAddress, plainMessage, htmlMessage) {
    var promise = new Promise(function (resolve, reject) {
        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        nodemailer.createTestAccount((err, account) => {
            if (err) {
                reject(err);
            }

            // create reusable transporter object using the default SMTP transport
            let transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: account.user, // generated ethereal user
                    pass: account.pass  // generated ethereal password
                }
            });

            // setup email data with unicode symbols
            let mailOptions = {
                from: '"The Clinic" <doctor@clinic.com>', // sender address
                to: emailAddress, // list of receivers
                subject: 'Recommendations From Your Doctor', // Subject line
                text: plainMessage, // plain text body
                html: htmlMessage // html body
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    reject(error);
                }
                console.log('Message sent: %s', info.messageId);
                // Preview only available when sending through an Ethereal account
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

                resolve(nodemailer.getTestMessageUrl(info));
                // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
                // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
            });
        });
    });
    return promise;
}

module.exports.sendMessage = function sendMessage(emailAddress, plainMessage, htmlMessage) {
    var promise = new Promise(function (resolve, reject) {
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: mail_server,
            port: mail_port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: '', // generated ethereal user
                pass: ''  // generated ethereal password
            }
        });

        // setup email data with unicode symbols
        let mailOptions = {
            from: from_address, // sender address
            to: emailAddress, // list of receivers
            subject: subject_line, // Subject line
            text: plainMessage, // plain text body
            html: htmlMessage // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error);
            }
            console.log('Message sent: %s', info.messageId);
        });
    });
    return promise;
}