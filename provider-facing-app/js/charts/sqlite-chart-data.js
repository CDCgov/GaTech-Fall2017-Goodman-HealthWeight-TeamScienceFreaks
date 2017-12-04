/**
 * Created by Hassan Borteh on 11/3/2017.
 */
var chart = require('../../lib/Chart.js');
var percentile_chartData = require('../../../Data/BMI_percentile.db');
var sqlite3 = require('sqlite3').verbose();
var dbExists = fs.existsSync(percentile_chartData);
var percentile_male = [];
var percentile_female = [];
var percentile_male_dict ={};
var percentile_female_dict = {};
db.serialize(function() {
    percentile_chartData.each("SELECT * FROM BMI WHERE BMI.gender = male ", function(err, row) {
        if (err) throw err;
        for (var i in row) {
            percentile_male.push(row[i].fifth_percentile, row[i].tenth_percentile, row[i].twenty_fifth_percentile,
                row[i].fiftieth_percentile, row[i].sevety_fifth_percentile, row[i].eighty_fifth_percentile,
                row[i].ninetieth_percentile, row[i].ninety_fifth_percentile)
            percentile_male_dict.push({key: row[i].age_month, value: percentile_male})
        }
    })
    percentile_chartData.each("SELECT * FROM BMI WHERE BMI.gender = female ", function(err, row) {
        if(err) throw err;
        for (var i in row) {
            percentile_female.push(row.fifth_percentile, row.tenth_percentile, row.twenty_fifth_percentile,
                row[i].fiftieth_percentile, row[i].sevety_fifth_percentile, row[i].eighty_fifth_percentile,
                row[i].ninetieth_percentile, row[i].ninety_fifth_percentile)
            percentile_male_dict.push({key: row[i].age_month, value: percentile_female})
        }

    })

});
percentile_chartData.close();
var keys_age = [];
//get age in month and store them in keys
for (var key in percentile_male_dict) {
    if (percentile_male_dict.hasOwnProperty(key)) {
        keys_age.push(key);
    }
}
function percentile_male_values(element) {
    var percentile = [];
    for (var key in percentile_male_dict ) {
        if (percentile_male_dict.hasOwnProperty(key)) {
            percentile.push(key)[element]
        }
    }
}
var lineChartData = {
    labels: keys,
    datasets: [{
        label: "Male BMI 5th Percentile Chart",
        borderColor: window.chartColors.red,
        backgroundColor: window.chartColors.red,
        fill: false,
        data: [

        ],
        yAxisID: "y-axis-1",
    }, {
        label: "My Second dataset",
        borderColor: window.chartColors.blue,
        backgroundColor: window.chartColors.blue,
        fill: false,
        data: [
            randomScalingFactor(),
            randomScalingFactor(),
            randomScalingFactor(),
            randomScalingFactor(),
            randomScalingFactor(),
            randomScalingFactor(),
            randomScalingFactor()
        ],
        yAxisID: "y-axis-2"
    }]
};

window.onload = function() {
    var ctx = document.getElementById("canvas").getContext("2d");
    window.myLine = Chart.Line(ctx, {
        data: lineChartData,
        options: {
            responsive: true,
            hoverMode: 'index',
            stacked: false,
            title:{
                display: true,
                text:'Chart.js Line Chart - Multi Axis'
            },
            scales: {
                yAxes: [{
                    type: "linear", // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                    display: true,
                    position: "left",
                    id: "y-axis-1",
                }, {
                    type: "linear", // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                    display: true,
                    position: "right",
                    id: "y-axis-2",

                    // grid line settings
                    gridLines: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                }],
            }
        }
    });
};

document.getElementById('randomizeData').addEventListener('click', function() {
    lineChartData.datasets.forEach(function(dataset) {
        dataset.data = dataset.data.map(function() {
            return randomScalingFactor();
        });
    });

    window.myLine.update();
});