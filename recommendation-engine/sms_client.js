const TWILIO_SID = "AC047dc26226e74e27ec2ecc7a112c1cdc";
const TWILIO_AUTH_TOKEN = "69d385cc4f0c9009d7cd678ee79c4f5e";
const TWILIO_FROM_PHONE = "16158100935";
var client = require('twilio')(TWILIO_SID, TWILIO_AUTH_TOKEN);

module.exports.sendMessage = function sendMessage(toPhoneNumber, message) {
    client.messages.create({
        body: message,
        to: toPhoneNumber,
        from: TWILIO_FROM_PHONE
    }).then(function (data) {
        console.log("Message sent: " + data);
    }).catch(function (err) {
        console.error('Could not send message');
        console.error(err);
    });
}
