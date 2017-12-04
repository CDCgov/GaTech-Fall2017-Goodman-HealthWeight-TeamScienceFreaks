const PORT = process.env.PORT || 8083;
var smsClient = require('./sms_client');
var emailClient = require('./email_client');
var express = require('express');
var https = require('https');
var app = express();
var bodyParser = require('body-parser');

const farmersMarketSearchByZipOptionData = ['search.ams.usda.gov', '/farmersmarkets/v1/data.svc/zipSearch?zip='];
const farmersMarketSearchByIdOptionData = ['search.ams.usda.gov', '/farmersmarkets/v1/data.svc/mktDetail?id='];
const geoServicesOptionData = ['maps.googleapis.com', '/maps/api/geocode/json?address='];
const geoServicesApiKey = "AIzaSyDPBtbXdzeup-txa9DAYUk-f_xBl78M6jA";
const parksSearchOptionData = ['maps.googleapis.com', '/maps/api/place/nearbysearch/json?rankby=distance&type=park&location='];
const parksSearchApiKey = "AIzaSyBgNd1IhNKAfWGWSgYo6iDlikyKZ5GsACM";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: "." });
});

app.post('/sendSms', (req, res) => {
    console.log('send sms');
    if (req.body.recommendationType == 'fm')
        sendFarmersMarketRecommendationSms(req, res);
    else
        sendParksRecommendationSms(req, res);
});

app.post('/sendEmail', (req, res) => {
    console.log('send email');
    if (req.body.recommendationType == 'fm') {
        sendFarmersMarketRecommendationEmail(req, res);
    }
    else {
        sendParksRecommendationEmail(req, res);
    }
});

app.listen(PORT, () => {
    console.log(`Recommendations app listening on port ${PORT}`)
});

function sendFarmersMarketRecommendationEmail(req, res) {
    var zipCode = req.body.zipCode;
    getFarmersMarkets(zipCode, 5)
        .then(markets => {
            var message = createEmailMessage('farmers\' markets', markets);
            if (req.body.testMessage) {
                emailClient.sendTestMessage(req.body.destination, message.plainMessage, message.htmlMessage)
                    .then(url => res.status(200).send(url))
                    .catch(err => {
                        console.log(err);
                        res.status(500).send();
                    });
            }
            else {
                emailClient.sendMessage(req.body.destination, message.plainMessage, message.htmlMessage)
                    .then(url => res.status(200).send({}))
                    .catch(err => {
                        console.log(err);
                        res.status(500).send();
                    });
            }
        });
}

function sendParksRecommendationEmail(req, res) {
    var zipCode = req.body.zipCode;
    getLocationFromZip(zipCode)
        .then(locationData => {
            getParks(locationData, 5)
                .then(parks => {
                    var message = createEmailMessage('parks', parks);
                    if (req.body.testMessage) {
                        emailClient.sendTestMessage(req.body.destination, message.plainMessage, message.htmlMessage)
                            .then(url => res.status(200).send(url))
                            .catch(err => {
                                console.log(err);
                                res.status(500).send();
                            });
                    }
                    else {
                        emailClient.sendMessage(req.body.destination, message.plainMessage, message.htmlMessage)
                            .then(id => res.status(200).send({}))
                            .catch(err => {
                                console.log(err);
                                res.status(500).send();
                            });
                    }
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).send();
                });
        })
        .catch(err => {
            console.log(err);
            res.status(500).send();
        });
}

function createEmailMessage(contentType, content) {
    var plainMessage = '';
    var htmlMessage = '';
    if (content.length == 0) {
        plainMessage = 'No ' + contentType + ' found in your zip code.';
        htmlMessage = plainMessage;
    }
    else {
        plainMessage = 'Below are ' + contentType + ' near your zip code: \n';
        htmlMessage = 'Below are ' + contentType + ' near your zip code: <br>';
        for (var i = 0; i < content.length; i++) {
            plainMessage += content[i].name + (content[i].distance ? ' (' + content[i].distance + ' mi.)\n' + content[i].address : '') + '\n\n';
            htmlMessage += content[i].name + (content[i].distance ? ' (' + content[i].distance + ' mi.)<br>' + content[i].address : '') + '   <a href=' + content[i].mapLink + '>Map</a><br><br>';
        }
    }

    return { plainMessage: plainMessage, htmlMessage: htmlMessage };
}

function sendFarmersMarketRecommendationSms(req, res) {
    var zipCode = req.body.zipCode;
    getFarmersMarkets(zipCode, 1)
        .then(markets => {
            smsClient.sendMessage(req.body.destination, createSmsMessage('farmers\' market', markets));
            res.status(200).send({});
        })
        .catch(err => {
            console.log(err);
            res.status(500).send();
        });
}

function sendParksRecommendationSms(req, res) {
    var zipCode = req.body.zipCode;
    getLocationFromZip(zipCode)
        .then(locationData => {
            getParks(locationData, 1)
                .then(parks => {
                    smsClient.sendMessage(req.body.destination, createSmsMessage('park', parks));
                    res.status(200).send({});
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).send();
                });
        })
        .catch(err => {
            console.log(err);
            res.status(500).send();
        });
}

function createSmsMessage(contentType, content) {
    var message = '';
    if (content.length == 0)
        message = 'No ' + contentType + ' found in your zip code.';
    else
        message = 'The nearest ' + contentType + ' is\n' + content[0].name + (content[0].address ? '\n' + content[0].address : '');

    return message;
}

function getFarmersMarkets(zipCode, limit) {
    var options = {
        host: farmersMarketSearchByZipOptionData[0],
        path: farmersMarketSearchByZipOptionData[1] + zipCode,
        headers: {
            'content-type': 'application/json; charset=utf-8'
        }
    }
    var promise = new Promise((resolve, reject) => {
        https.get(options, resp => {
            var body = '';
            var markets = [];

            resp.on('data', chunk => {
                body += chunk;
            });

            resp.on('end', () => {
                var marketResponse = JSON.parse(body);
                var totalToProcess = Math.min(marketResponse['results'].length, limit);
                var processed = 0;
                for (var i = 0; i < totalToProcess; i++) {
                    var id = marketResponse['results'][i]['id'];
                    var nameParts = (marketResponse['results'][i]['marketname']).split(' ');
                    var distance = nameParts[0];
                    var name = nameParts.slice(1).join(' ');
                    markets.push({});

                    getMarketDetail(i, name, distance, id)
                        .then(marketData => {
                            processed += 1;
                            markets[marketData.index] = marketData;
                            if (processed == totalToProcess)
                                resolve(markets);
                        });
                }
                if (totalToProcess == 0)
                    resolve(markets);
            });
        }).on('error', err => reject(err));
    });
    return promise;
}

function getMarketDetail(index, name, distance, id) {
    var options = {
        host: farmersMarketSearchByIdOptionData[0],
        path: farmersMarketSearchByIdOptionData[1] + id,
        headers: {
            'content-type': 'application/json; charset=utf-8'
        }
    }
    var promise = new Promise((resolve, reject) => {
        https.get(options, detailResponse => {
            var body = '';
            detailResponse.on('data', chunk => {
                body += chunk;
            });

            detailResponse.on('end', () => {
                var detailJSON = JSON.parse(body)['marketdetails'];
                resolve({
                    index: index,
                    name: name,
                    distance: distance,
                    address: detailJSON['Address'],
                    mapLink: detailJSON['GoogleLink']
                });
            });
        }).on('error', err => reject(err));
    });
    return promise;
}

function getLocationFromZip(zipCode) {
    var options = {
        host: geoServicesOptionData[0],
        path: geoServicesOptionData[1] + zipCode + '&key=' + geoServicesApiKey,
        headers: {
            'content-type': 'application/json; charset=utf-8'
        }
    };
    var promise = new Promise((resolve, reject) => {
        https.get(options, resp => {
            var body = '';

            resp.on('data', chunk => {
                body += chunk;
            });

            resp.on('end', () => {
                var locationResponse = JSON.parse(body)['results'][0]['geometry']['location'];
                resolve({
                    latitude: locationResponse['lat'],
                    longitude: locationResponse['lng']
                });
            });
        }).on('error', err => reject(err));
    });
    return promise;
}

function getParks(locationData, limit) {
    options = {
        host: parksSearchOptionData[0],
        path: parksSearchOptionData[1] + locationData.latitude + ',' + locationData.longitude + '&key=' + parksSearchApiKey,
        headers: {
            'content-type': 'application/json; charset=utf-8'
        }
    };
    var promise = new Promise((resolve, reject) => {

        https.get(options, resp => {
            var body = '';

            resp.on('data', chunk => {
                body += chunk;
            });

            resp.on('end', () => {
                var parks = [];
                var parksDetails = JSON.parse(body)['results'];
                var totalToProcess = Math.min(parksDetails.length, limit);
                for (var i = 0; i < totalToProcess; i++) {
                    parks.push({
                        name: parksDetails[i]['name'],
                        mapLink: createMapUrl(parksDetails[i]['place_id'])
                    });
                }
                resolve(parks);
            });
        }).on('error', err => reject(err));
    });

    return promise;
}

function createMapUrl(place_id) {
    return 'https://www.google.com/maps/place/?q=place_id:' + place_id;
}