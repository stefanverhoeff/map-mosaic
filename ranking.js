define(function () {
    "use strict";

    var funcs = {
        calcBySum:function (data, sumFunc) {
            var i, sum = 0;

            for (i = 0; i < data.length; i += 4) {
                sum += sumFunc(data, i);
            }

            return sum / (data.length / 4);
        },
        calcAvgColor:function (data) {
            return funcs.calcBySum(data, function (data, index) {
                return (data[index] + data[index + 1] + data[index + 2]) / 3.0;
            });
        },
        calcMedianColor:function (data) {
            var i, values = [];

            for (i = 0; i < data.length; i += 4) {
                values.push((data[i] + data[i + 1] + data[i + 2]) / 3.0);
            }

            values.sort();

            return values[Math.floor(values.length / 2)];
        },
        calcAvgRed:function (data) {
            return funcs.calcBySum(data, function (data, index) {
                return data[index] - (data[index + 1] + data[index + 2]) / 2;
            });
        },
        calcAvgGreen:function (data) {
            return funcs.calcBySum(data, function (data, index) {
                return data[index + 1] - (data[index] + data[index + 2]) / 2;
            });
        },
        calcAvgBlue:function (data) {
            return funcs.calcBySum(data, function (data, index) {
                return data[index + 2] - (data[index] + data[index + 1]) / 2;
            });
        }
    }

    return funcs;
});