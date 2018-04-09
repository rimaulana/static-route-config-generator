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

const generate = (prefix, options) => {
  switch (options.vendor.toLowerCase()) {
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
  const seqString = options.fortigate['starting-sequence'] || '1';
  let sequence = parseInt(seqString, 10);

  if (options.vendor.toLowerCase() === 'fortigate') {
    result.push('config router static');
  } else if (options.vendor.toLowerCase() === 'mikrotik') {
    result.push('/ip route');
  }

  prefixes.forEach((prefix) => {
    result.push(generate(prefix, Object.assign({}, options, { sequence })));
    sequence += 1;
  });
  return result.join('\n');
};

module.exports = {
  run,
};
