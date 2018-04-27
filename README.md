# Static Route Config Generator

[![CircleCI](https://img.shields.io/circleci/project/github/rimaulana/static-route-config-generator.svg)](https://circleci.com/gh/rimaulana/static-route-config-generator/tree/master) [![codecov](https://codecov.io/gh/rimaulana/static-route-config-generator/branch/master/graph/badge.svg)](https://codecov.io/gh/rimaulana/static-route-config-generator) [![codebeat badge](https://codebeat.co/badges/dcef7362-7fc7-4c3d-bed7-97c28f22f7f7)](https://codebeat.co/projects/github-com-rimaulana-static-route-config-generator-master) [![Maintainability](https://api.codeclimate.com/v1/badges/9404c62584bd01ddfd59/maintainability)](https://codeclimate.com/github/rimaulana/static-route-config-generator/maintainability) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

This utility will help you generate static routes configuration for Cisco, Fortigate and Mikrotik devices from online json file as well as local txt.

## Installation

You need to clone this repository then run

```bash
npm install
```

## Config File

Additional configuration for this script is defined in package.json file section config which will look like this

```json
{
    "config": {
        "gateway": "10.10.10.1",
        "administrative-distance": "",
        "out-interface": "ether1",
        "comment": "pull-to-aws",
        "filters": [
            {
                "Key": "region",
                "Values": [
                    "ap-southeast-1",
                    "ap-southeast-2"
                ]
            }
        ],
        "cisco": {
            "tracking": "1"
        },
        "fortigate": {
            "starting-sequence": "23"
        }
    }
}
```

### gateway

This should define the IP address of the gateway of the routes we are going to define. you can leave this empty by defining double quotes("") only if you are generating config for Mikrotik or Cisco and you define the out-interface option.

### administrative distance

This config is used to define the administrative distance of the routes in case you want it not to have a default administrative distance, you can simply put empty string if you don't want to define it.

### out-interface

This is value tell the routes to go to specific interface to reach the destination prefix. However you need to use this with precaution by making sure that its connection type is point-to-point. But, you will need to be define it when you are
generating config for Fortigate and this is optional for Mikrotik and cisco as long as you defined the gateway. For Mikrotik and Cisco, if both gateway and out-interface is define, out-interface will be prioritized first.

### comment

I think the name itself is self explanatory

### filters

by default if we run the script, it will read a online json file from Amazon prefixes (https://ip-ranges.amazonaws.com/ip-ranges.json). So the filter we defined here will filter the data based on key and value we provide. In this example, we will get only prefixes that also has region property with the values defined. The limitation of the filter is that it can only work with a valid JSON data.

### cisco tracking

Fill this if you need static route configuration with object tracking IP SLA

### fortigate starting-sequence

We know that Fortigate will put sequence number when adding new static route config. So I put it here just in case that the sequence is not started from 1.

## Running the Script

You can run the script by simply execute this command For Cisco

```bash
npm run cisco
```

For Mikrotik

```bash
npm run mikrotik
```

For Fortigate

```bash
npm run fortigate
```

Custom

```bash
npm run generate
```

### parameters

The above command can be chained with additional parameters, the available parameters are: -vendor="vendor_name" only support mikrotik, cisco, fortigate -url="file-location" can be online url or local path to file for example we want to generate
mikrotik config from local file in ./tests/routes.txt

```bash
npm run mikrotik -- -url="./tests/routes.txt"
```

or you can do

```bash
npm run generate -- -vendor="mikrotik" -url="./tests/routes.txt"
```

## Sample input and output

input file contains

```text
172.16.28.0/24
empty
routes:172.18.78.0/26
# 202.128.239.0/29
// 202.128.239.0/27
```

while config file

```json
{
    "config": {
        "gateway": "192.168.99.1",
        "administrative-distance": "",
        "out-interface": "ether1",
        "comment": "pull-to-aws",
        "filters": [], 
        "cisco": {
            "tracking": "1"
        },
        "fortigate": {
            "starting-sequence": ""
        }
    }
}
```

### Cisco config

```text
ip route 172.16.28.0 255.255.255.0 ether1 track 1
ip route 172.18.78.0 255.255.255.192 ether1 track 1
```

### Mikrotik config

```text
/ip route
add dst-address=172.16.28.0/24 gateway=ether1 comment="pull-to-aws"
add dst-address=172.18.78.0/26 gateway=ether1 comment="pull-to-aws"
```

### Fortigate config

```text
config router static
edit 1
set dst 172.16.28.0/24
set gateway 192.168.99.1
set device "ether1"
set comment "pull-to-aws"
next
edit 2
set dst 172.18.78.0/26
set gateway 192.168.99.1
set device "ether1"
set comment "pull-to-aws"
next
```

## Testing this Code

```bash
npm run build
```
