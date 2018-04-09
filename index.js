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

const formatCisco = (prefix, options) => {
  const ipPrefix = prefix.split('/');
  const egress = options['out-interface'] || options.gateway;
  const distance = options['administrative-distance'] ? ` ${options['administrative-distance']}` : '';
  const track = options.cisco.tracking ? ` track ${options.cisco.tracking}` : '';
  return `ip route ${ipPrefix[0]} ${tomask(ipPrefix[1])} ${egress}${distance}${track}`;
};

const formatMikrotik = (prefix, options) => {
  const distance = options['administrative-distance'] !== '' ? ` distance=${options['administrative-distance']}` : '';
  const egress = options['out-interface'] !== '' ? ` gateway=${options['out-interface']}` : ` gateway=${options.gateway}`;
  const comment = options.comment !== '' ? ` comment="${options.comment}"` : '';
  return `add dst-address=${prefix}${distance}${egress}${comment}`;
};

const formatFortigate = (prefix, options) => {
  const distance = options['administrative-distance'] !== '' ? `\nset distance ${options['administrative-distance']}` : '';
  const comment = options.comment !== '' ? `\nset comment "${options.comment}"` : '';
  return `edit ${options.sequence}\nset dst ${prefix}\nset gateway ${
    options.gateway
  }${distance}\nset device ${options['out-interface']}${comment}\nnext`;
};

const generate = (prefix, vendor, options) => {
  switch (vendor.toLowerCase()) {
    case 'cisco':
      return formatCisco(prefix, options);
    case 'fortigate':
      return formatFortigate(prefix, options);
    default:
      return formatMikrotik(prefix, options);
  }
};

const run = (prefixes, options) => {
  const result = [];
  let sequence = parseInt(options.fortigate['starting-sequence'], 10);

  if (options.vendor.toLowerCase() === 'fortigate') {
    result.push('config router static');
  } else if (options.vendor.toLowerCase() === 'mikrotik') {
    result.push('/ip route');
  }

  prefixes.forEach((prefix) => {
    result.push(generate(prefix, Object.assign({}, options, { sequence })));
    sequence += 1;
  });
  return result.join('/n');
};

// function run(param, callback) {
//   if (!callback) {
//     throw new Error('Callback is not defined');
//   }
//   const ipPattern = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:\s+)?\/(?:\s+)?\d{1,2}/g;
//   const { vendor } = param;
//   const url = param.url || endpoint;
//   let result = '';
//   const promises = [];
//   if (/(http[s]?:\/\/)([^\/\s]+\/)(.*)/.test(url)) {
//     promises.push(getdata(url));
//   } else {
//     promises.push(new Promise(((resolve, reject) => {
//       fs.readFile(url, (err, data) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(data.toString().split('\n'));
//         }
//       });
//     })));
//   }
//   Promise.all(promises)
//     .then((data) => {
//       let sequence = parseInt(config.fortigate['starting-sequence']);

//       if (vendor.toLowerCase() === 'fortigate') {
//         result += 'config router static\n';
//       } else if (vendor.toLowerCase() === 'mikrotik') {
//         result += '/ip route\n';
//       }

//       if (data[0].constructor === Array) {
//         for (var i in data[0]) {
//           let parsed = data[0][i].replace(/(?:#|\/\/).*/, '');
//           parsed = parsed.match(ipPattern);
//           if (parsed) {
//             result +=
//               `${
//                 generate(
//                   {
//                     vendor: vendor.toLowerCase(),
//                     prefix: parsed[0],
//                     config,
//                   },
//                   sequence,
//                 )
//               } \n`;
//             sequence += 1;
//           }
//         }
//       } else {
//         try {
//           var parseRaw = JSON.parse(data[0]);
//           for (var i in parseRaw.prefixes) {
//             if (config.regions.includes(parseRaw.prefixes[i].region)) {
//               result +=
//                 `${
//                   generate(
//                     {
//                       vendor: vendor.toLowerCase(),
//                       prefix: parseRaw.prefixes[i].ip_prefix,
//                       config,
//                     },
//                     sequence,
//                   )
//                 } \n`;
//               sequence += 1;
//             }
//           }
//         } catch (error) {
//           const lines = data[0].split('\n');
//           for (const x in lines) {
//             var parseRaw = lines[x].replace(/(?:#|\/\/).*/, '');
//             parseRaw = parseRaw.match(ipPattern);
//             if (parseRaw) {
//               result +=
//                 `${
//                   generate(
//                     {
//                       vendor: vendor.toLowerCase(),
//                       prefix: parseRaw[0],
//                       config,
//                     },
//                     sequence,
//                   )
//                 } \n`;
//               sequence += 1;
//             }
//           }
//         }
//       }
//       callback(null, result);
//     })
//     .catch((error) => {
//       callback(error, null);
//     });
// }

module.exports = {
  tomask,
  run,
  generate,
};
