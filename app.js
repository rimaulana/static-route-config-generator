const generator = require('./index');

let vendorArg = 'mikrotik';
let urlArg = null;

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
  urlArg = getArgument(process.argv, 'url') || null;
}

generator.run({ vendor: vendorArg, url: urlArg }, (error, data) => {
  if (error) {
    console.log(error);
  } else {
    console.log(data);
  }
});
