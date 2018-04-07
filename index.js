const https = require('https');

const endpoint = 'https://ip-ranges.amazonaws.com/ip-ranges.json';
const { config } = require('./package');
const fs = require('fs');

const tomask = (input) => {
  const mask = [];
  let bitCount = input || 32;
  [1, 2, 3, 4].forEach(() => {
    const n = Math.min(bitCount, 8);
    mask.push(256 - (2 ** (8 - n)));
    bitCount -= n;
  });
  return mask.join('.');
};

const formatCisco = (input) => {
  const ipPrexix = input.prefix.split('/');
  const egress = input.config['out-interface'] || input.config.gateway;
  const distance = input.config['administrative-distance'] ? ` ${input.config['administrative-distance']}` : '';
  const track = input.config.cisco.tracking ? ` track ${input.config.cisco.tracking}` : '';
  return `ip route ${ipPrexix[0]} ${tomask(ipPrexix[1])} ${egress}${distance}${track}`;
};

const formatMikrotik = (input) => {
  const distance = input.config['administrative-distance'] !== '' ? ` distance=${input.config['administrative-distance']}` : '';
  const egress = input.config['out-interface'] !== '' ? ` gateway=${input.config['out-interface']}` : ` gateway=${input.config.gateway}`;
  const comment = input.config.comment !== '' ? ` comment="${input.config.comment}"` : '';
  return `add dst-address=${input.prefix}${distance}${egress}${comment}`;
};

const formatFortigate = (input, sequence) => {
  const distance = input.config['administrative-distance'] !== '' ? `\nset distance ${input.config['administrative-distance']}` : '';
  const comment = input.config.comment !== '' ? `\nset comment "${input.config.comment}"` : '';
  return `edit ${sequence}\nset dst ${input.prefix}\nset gateway ${
    input.config.gateway
  }${distance}\nset device ${input.config['out-interface']}${comment}\nnext`;
};

const generate = (params, sequence) => {
  switch (params.vendor.toLowerCase()) {
    case 'cisco':
      return formatCisco(params);
    case 'fortigate':
      return formatFortigate(params, sequence);
    default:
      return formatMikrotik(params);
  }
};


function run(param, callback) {
  if (!callback) {
    throw new Error('Callback is not defined');
  }
  const ipPattern = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:\s+)?\/(?:\s+)?\d{1,2}/g;
  const { vendor } = param;
  const url = param.url || endpoint;
  let result = '';
  const promises = [];
  if (/(http[s]?:\/\/)([^\/\s]+\/)(.*)/.test(url)) {
    promises.push(getdata(url));
  } else {
    promises.push(new Promise(((resolve, reject) => {
      fs.readFile(url, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.toString().split('\n'));
        }
      });
    })));
  }
  Promise.all(promises)
    .then((data) => {
      let sequence = parseInt(config.fortigate['starting-sequence']);

      if (vendor.toLowerCase() === 'fortigate') {
        result += 'config router static\n';
      } else if (vendor.toLowerCase() === 'mikrotik') {
        result += '/ip route\n';
      }

      if (data[0].constructor === Array) {
        for (var i in data[0]) {
          let parsed = data[0][i].replace(/(?:#|\/\/).*/, '');
          parsed = parsed.match(ipPattern);
          if (parsed) {
            result +=
              `${
                generate(
                  {
                    vendor: vendor.toLowerCase(),
                    prefix: parsed[0],
                    config,
                  },
                  sequence,
                )
              } \n`;
            sequence += 1;
          }
        }
      } else {
        try {
          var parseRaw = JSON.parse(data[0]);
          for (var i in parseRaw.prefixes) {
            if (config.regions.includes(parseRaw.prefixes[i].region)) {
              result +=
                `${
                  generate(
                    {
                      vendor: vendor.toLowerCase(),
                      prefix: parseRaw.prefixes[i].ip_prefix,
                      config,
                    },
                    sequence,
                  )
                } \n`;
              sequence += 1;
            }
          }
        } catch (error) {
          const lines = data[0].split('\n');
          for (const x in lines) {
            var parseRaw = lines[x].replace(/(?:#|\/\/).*/, '');
            parseRaw = parseRaw.match(ipPattern);
            if (parseRaw) {
              result +=
                `${
                  generate(
                    {
                      vendor: vendor.toLowerCase(),
                      prefix: parseRaw[0],
                      config,
                    },
                    sequence,
                  )
                } \n`;
              sequence += 1;
            }
          }
        }
      }
      callback(null, result);
    })
    .catch((error) => {
      callback(error, null);
    });
}

module.exports = {
  tomask,
  run,
  generate,
  getdata,
};
