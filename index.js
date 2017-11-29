"use strict";
const https = require("https");
const endpoint = "https://ip-ranges.amazonaws.com/ip-ranges.json";
const config = require("./package").config;
var fs = require("fs");

function tomask(bitCount) {
    var mask = [];
    for (var i = 0; i < 4; i++) {
        var n = Math.min(bitCount, 8);
        mask.push(256 - Math.pow(2, 8 - n));
        bitCount -= n;
    }
    return mask.join(".");
}

function generate(params, sequence) {
    var result = "";
    switch (params.vendor.toLowerCase()) {
        case "cisco":
            var ipAddr = params.prefix.split("/");
            result =
                "ip route " +
                ipAddr[0] +
                " " +
                tomask(ipAddr[1]) +
                (params.config["out-interface"] !== "" ? " " + params.config["out-interface"] : " " + params.config["gateway"]) +
                (params.config["administrative-distance"] !== "" ? " " + params.config["administrative-distance"] : "") +
                (params.config.cisco.tracking !== "" ? " track " + params.config.cisco.tracking : "");
            break;
        case "fortigate":
            result =
                "edit " +
                sequence +
                "\nset dst " +
                params.prefix +
                "\nset gateway " +
                params.config.gateway +
                (params.config["administrative-distance"] !== "" ? "\nset distance " + params.config["administrative-distance"] : "") +
                '\nset device "' +
                params.config["out-interface"] +
                '"' +
                (params.config.comment !== "" ? '\nset comment "' + params.config.comment + '"' : "") +
                "\nnext";
            break;
        case "mikrotik":
            result =
                "add dst-address=" +
                params.prefix +
                (params.config["administrative-distance"] !== "" ? " distance=" + params.config["administrative-distance"] : "") +
                (params.config["out-interface"] !== "" ? " gateway=" + params.config["out-interface"] : " gateway=" + params.config.gateway) +
                (params.config.comment !== "" ? ' comment="' + params.config.comment + '"' : "");
            break;
    }
    return result;
}

function getdata(url) {
    return new Promise(function(resolve, reject) {
        var result = "";
        https
            .get(url, res => {
                res.on("data", data => {
                    result += data;
                });
                res.on("end", function() {
                    resolve(result);
                });
            })
            .on("error", e => {
                reject(e);
            });
    });
}

function run(param, callback) {
    if (!callback) {
        throw new Error("Callback is not defined");
    }
    const ipPattern = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:\s+)?\/(?:\s+)?\d{1,2}/g;
    const vendor = param.vendor;
    const url = param.url || endpoint;
    var result = "";
    var promises = [];
    if (/(http[s]?:\/\/)([^\/\s]+\/)(.*)/.test(url)) {
        promises.push(getdata(url));
    } else {
        promises.push(
            new Promise(function(resolve, reject) {
                fs.readFile(url, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data.toString().split("\n"));
                    }
                });
            })
        );
    }
    Promise.all(promises)
        .then(data => {
            var sequence = parseInt(config.fortigate["starting-sequence"]);

            if (vendor.toLowerCase() === "fortigate") {
                result += "config router static\n";
            } else if (vendor.toLowerCase() === "mikrotik") {
                result += "/ip route\n";
            }

            if (data[0].constructor === Array) {
                for (var i in data[0]) {
                    var parsed = data[0][i].replace(/(?:#|\/\/).*/, "");
                    parsed = parsed.match(ipPattern);
                    if (parsed) {
                        result +=
                            generate(
                                {
                                    vendor: vendor.toLowerCase(),
                                    prefix: parsed[0],
                                    config: config
                                },
                                sequence
                            ) + "\n";
                        sequence += 1;
                    }
                }
            } else {
                try {
                    var parseRaw = JSON.parse(data[0]);
                    for (var i in parseRaw.prefixes) {
                        if (config.regions.includes(parseRaw.prefixes[i].region)) {
                            result +=
                                generate(
                                    {
                                        vendor: vendor.toLowerCase(),
                                        prefix: parseRaw.prefixes[i].ip_prefix,
                                        config: config
                                    },
                                    sequence
                                ) + "\n";
                            sequence += 1;
                        }
                    }
                } catch (error) {
                    var lines = data[0].split("\n");
                    for (var x in lines) {
                        var parseRaw = lines[x].replace(/(?:#|\/\/).*/, "");
                        parseRaw = parseRaw.match(ipPattern);
                        if (parseRaw) {
                            result +=
                                generate(
                                    {
                                        vendor: vendor.toLowerCase(),
                                        prefix: parseRaw[0],
                                        config: config
                                    },
                                    sequence
                                ) + "\n";
                            sequence += 1;
                        }
                    }
                }
            }
            callback(null, result);
        })
        .catch(error => {
            callback(error, null);
        });
}

module.exports = {
    tomask: tomask,
    run: run,
    generate: generate,
    getdata: getdata
};
