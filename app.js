const generator = require('./generator');
const downloader = require('./file');

let vendorArg = 'mikrotik';
let urlArg = 'https://ip-ranges.amazonaws.com/ip-ranges.json';

const { config } = require('./package');

const vendorRegex = new RegExp('\\-vendor(?:\\:|\\=)(?:\\")?([^"]+)(?:\\")?');
const urlRegex = new RegExp('\\-url(?:\\:|\\=)(?:\\")?([^"]+)(?:\\")?');

const getArgument = (arg, type) => {
  const regex = type === 'vendor' ? vendorRegex : urlRegex;
  let result = null;
  arg.forEach((argv) => {
    if (regex.test(argv)) {
      result = argv.split('=')[1].replace('"', '');
    }
  });
  return result;
};

if (process.argv.length > 1) {
  vendorArg = getArgument(process.argv, 'vendor') || vendorArg;
  urlArg = getArgument(process.argv, 'url') || urlArg;
}

downloader.getData(urlArg, config.filters)
  .then((prefixes) => {
    console.log(generator.run(prefixes, Object.assign(config, { vendor: vendorArg })));
  })
  .catch((error) => {
    console.log(error);
  });
