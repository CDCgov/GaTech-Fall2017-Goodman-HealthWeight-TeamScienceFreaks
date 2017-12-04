const fhir_server = process.env.FHIR_SERVER || 'fhir_server';
const fhir_base = process.env.FHIR_BASE || '/gt-healthy-weight/baseDstu2';
const PORT = process.env.PORT || 8082;
var express = require('express');
var http = require('http');
var app = express();
var bodyParser = require('body-parser');
app.use('/css', express.static(`${__dirname}/css`));
app.use('/fonts', express.static(`${__dirname}/fonts`));
app.use('/img', express.static(`${__dirname}/img`));
app.use('/js', express.static(`${__dirname}/js`));
//app.use('/contactform', express.static(`${__dirname}/contactform`));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: '.' });
});

app.get('/index.html', (req, res) => {
    res.sendFile('index.html', { root: '.' });
});

app.post('/response', (req, res) => {
    sendResponse(req.body)
        .then(()=>{
            res.status(201).send();
        })
        .catch(err=>{
            console.log(err);
            res.status(500).send();
        })
});

app.listen(PORT, () => {
    console.log(`Patient facing app listening on port ${PORT}`);
});


function sendResponse(response) {
    var options = {
        host: fhir_server,
        port: 8080,
        method: 'POST',
        path: `${fhir_base}/QuestionnaireResponse`,
        headers: {
            'content-type': 'application/json; charset=utf-8'
        }
    }
    var promise = new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`);
            });
            res.on('end', () => {
                resolve();
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        // write data to request body
        req.write(JSON.stringify(response));
        req.end();
    });

    return promise;
}
