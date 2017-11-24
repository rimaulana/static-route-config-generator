# static-route-config-generator

[![Build Status](https://travis-ci.org/rimaulana/static-route-config-generator.svg?branch=master)](https://travis-ci.org/rimaulana/static-route-config-generator)
[![Coverage Status](https://coveralls.io/repos/github/rimaulana/static-route-config-generator/badge.svg?branch=master)](https://coveralls.io/github/rimaulana/static-route-config-generator?branch=master)

This utility will help you generate static routes configuration for Cisco, Fortigate and Mikrotik devices from online json file as well as local txt.

## Instalation

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
        "regions": ["ap-southeast-1", "ap-southeast-2"],
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

### regions

by default if we run the script, it will read a online json file from Amazon prefixes (https://ip-ranges.amazonaws.com/ip-ranges.json). So the regions config stated here is required to filter the prefixes from which region you want to generate.

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

The above command can be chainned with additional parameters, the available parameters are: -vendor="vendor_name" only support mikrotik, cisco, fortigate -url="file-location" can be online url or local path to file for example we want to generate
mikrotik config from local file in ./tests/routes.txt

```bash
npm run mikrotik -- -url="./tests/routes.txt"
```

or you can do

```bash
npm run generate -- -vendor="mikrotik" -url="./tests/routes.txt"
```

## Testing this Code

```bash
npm run build
```
