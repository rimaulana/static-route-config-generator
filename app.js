"use strict";
var generator = require("./index");

if (process.argv.length > 2) {
    for (var i = 0; i <= process.argv.length; i++) {
        if (/\-vendor(?:\:|\=)(?:\")?([^"]+)(?:\")?/.test(process.argv[i])) {
            var vendorArg = process.argv[i].match(/\-vendor(?:\:|\=)(?:\")?([^"]+)(?:\")?/)[1];
        } else if (/\-url(?:\:|\=)(?:\")?([^"]+)(?:\")?/.test(process.argv[i])) {
            var urlArg = process.argv[i].match(/\-url(?:\:|\=)(?:\")?([^"]+)(?:\")?/)[1];
        }
    }
}
generator.run(
    {
        vendor: vendorArg || "mikrotik",
        url: urlArg || null
    },
    function(error, data) {
        if (error) {
            console.log(error);
        } else {
            console.log(data);
        }
    }
);
