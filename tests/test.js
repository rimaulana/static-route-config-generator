"use strict";
var expect = require("chai").expect;
var generator = require("../index");

describe("Convert from CIDR / notation to subnet mask notation", function() {
    it("Should return 255.255.255.0", function() {
        var result = generator.tomask("24");
        expect(result).to.equal("255.255.255.0");
    });
    it("Should return 255.248.0.0", function() {
        var result = generator.tomask("13");
        expect(result).to.equal("255.248.0.0");
    });
});

describe("Generate vendor specific config commands", function() {
    it("Should return mikrotik config without administrative distance and comment", function() {
        var result = generator.generate({
            vendor: "mikrotik",
            prefix: "10.0.0.0/16",
            config: {
                gateway: "20.20.20.1",
                "administrative-distance": "",
                "out-interface": "",
                comment: ""
            }
        });
        expect(result).to.equal("add dst-address=10.0.0.0/16 gateway=20.20.20.1");
    });

    it("Should return mikrotik config with administrative distance and comment", function() {
        var result = generator.generate({
            vendor: "mikrotik",
            prefix: "10.0.0.0/16",
            config: {
                gateway: "20.20.20.1",
                "administrative-distance": "20",
                "out-interface": "ether1",
                comment: "pull-to-aws"
            }
        });
        expect(result).to.equal('add dst-address=10.0.0.0/16 distance=20 gateway=ether1 comment="pull-to-aws"');
    });

    it("Should return cisco config with administrative distance and tracking", function() {
        var result = generator.generate({
            vendor: "cisco",
            prefix: "10.0.0.0/16",
            config: {
                gateway: "20.20.20.1",
                "administrative-distance": "20",
                "out-interface": "Dialer1",
                cisco: {
                    tracking: "1"
                }
            }
        });
        expect(result).to.equal("ip route 10.0.0.0 255.255.0.0 Dialer1 20 track 1");
    });

    it("Should return cisco config without administrative distance and tracking", function() {
        var result = generator.generate({
            vendor: "cisco",
            prefix: "10.0.0.0/16",
            config: {
                gateway: "20.20.20.1",
                "administrative-distance": "",
                "out-interface": "",
                cisco: {
                    tracking: ""
                }
            }
        });
        expect(result).to.equal("ip route 10.0.0.0 255.255.0.0 20.20.20.1");
    });

    it("Should return fortigate config with sequence number of 1 but without administrative distance and comment", function() {
        var result = generator.generate(
            {
                vendor: "fortigate",
                prefix: "10.0.0.0/16",
                config: {
                    gateway: "20.20.20.1",
                    "administrative-distance": "",
                    "out-interface": "wan1",
                    comment: "",
                    fortigate: {
                        "starting-sequence": ""
                    }
                }
            },
            1
        );
        expect(result).to.equal('edit 1\nset dst 10.0.0.0/16\nset gateway 20.20.20.1\nset device "wan1"\nnext');
    });

    it("Should return fortigate config with sequence number of 23, administrative distance and comment ", function() {
        var result = generator.generate(
            {
                vendor: "fortigate",
                prefix: "10.0.0.0/16",
                config: {
                    gateway: "20.20.20.1",
                    "administrative-distance": "20",
                    "out-interface": "wan1",
                    comment: "pull-to-aws",
                    fortigate: {
                        "starting-sequence": "23"
                    }
                }
            },
            23
        );
        expect(result).to.equal('edit 23\nset dst 10.0.0.0/16\nset gateway 20.20.20.1\nset distance 20\nset device "wan1"\nset comment "pull-to-aws"\nnext');
    });
});

describe("Download list file online", function() {
    it("Able to download file online and parse it into JSON object", function(done) {
        var url = "https://raw.githubusercontent.com/rimaulana/static-route-config-generator/master/tests/test-range.json";
        generator.getdata(url).then(result => {
            expect(JSON.parse(result)).to.have.property("prefixes");
            done();
        });
    });
});

describe("Generate mikrotik config command", function() {
    it("Should generate from online file source", function() {
        generator.run(
            {
                vendor: "mikrotik",
                url: "https://raw.githubusercontent.com/rimaulana/static-route-config-generator/master/tests/test-range.json"
            },
            function(error, data) {
                expect(data).to.be.equal('/ip route\nadd dst-address=13.228.0.0/15 gateway=ether1 comment="pull-to-aws"\nadd dst-address=13.210.0.0/15 gateway=ether1 comment="pull-to-aws"\n');
            }
        );
    });
    it("Should generate from local config file", function() {
        generator.run(
            {
                vendor: "mikrotik",
                url: "./tests/routes.txt"
            },
            function(error, data) {
                expect(data).to.be.equal('/ip route\nadd dst-address=172.16.28.0/24 gateway=ether1 comment="pull-to-aws"\nadd dst-address=172.18.78.0/26 gateway=ether1 comment="pull-to-aws"\n');
            }
        );
    });
});

describe("Generate fortigate config command", function() {
    it("Should generate from online file source", function() {
        generator.run(
            {
                vendor: "fortigate",
                url: "https://raw.githubusercontent.com/rimaulana/static-route-config-generator/master/tests/test-range.json"
            },
            function(error, data) {
                expect(data).to.be.equal(
                    'config router static\nedit 23\nset dst 13.228.0.0/15\nset gateway 10.10.10.1\nset device "ether1"\nset comment "pull-to-aws"\nnext\nedit 24\nset dst 13.210.0.0/15\nset gateway 10.10.10.1\nset device "ether1"\nset comment "pull-to-aws"\nnext\n'
                );
            }
        );
    });
    it("Should generate from local config file", function() {
        generator.run(
            {
                vendor: "fortigate",
                url: "./tests/routes.txt"
            },
            function(error, data) {
                expect(data).to.be.equal(
                    'config router static\nedit 23\nset dst 172.16.28.0/24\nset gateway 10.10.10.1\nset device "ether1"\nset comment "pull-to-aws"\nnext\nedit 24\nset dst 172.18.78.0/26\nset gateway 10.10.10.1\nset device "ether1"\nset comment "pull-to-aws"\nnext\n'
                );
            }
        );
    });
});

describe("Generate cisco config command", function() {
    it("Should generate from online file source", function() {
        generator.run(
            {
                vendor: "cisco",
                url: "https://raw.githubusercontent.com/rimaulana/static-route-config-generator/master/tests/routes.txt"
            },
            function(error, data) {
                expect(data).to.be.equal("ip route 172.16.28.0 255.255.255.0 ether1 track 1\nip route 172.18.78.0 255.255.255.192 ether1 track 1\n");
            }
        );
    });
    it("Should generate from online file source", function() {
        generator.run(
            {
                vendor: "cisco"
            },
            function(error, data) {
                expect(data.length).to.be.above(0);
            }
        );
    });
    it("Should generate from local config file", function() {
        generator.run(
            {
                vendor: "cisco",
                url: "./tests/routes.txt"
            },
            function(error, data) {
                expect(data).to.be.equal("ip route 172.16.28.0 255.255.255.0 ether1 track 1\nip route 172.18.78.0 255.255.255.192 ether1 track 1\n");
            }
        );
    });
});
describe("Generator run error handling", function() {
    it("Should throw error when callback is not set", function() {
        try {
            generator.run({
                vendor: "cisco",
                url: "./tests/routes.txt"
            });
        } catch (error) {
            expect(error.message).to.be.equal("Callback is not defined");
        }
    });
});
describe("File error handling", function() {
    it("Download from non-existent local text file should return error", function() {
        generator.run(
            {
                vendor: "fortigate",
                url: "./tests/non-exist-routes.txt"
            },
            function(error, data) {
                expect(error).to.have.property("message");
                expect(data).to.be.equal(null);
            }
        );
    });
});
