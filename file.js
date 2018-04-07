const https = require('https');

const endpoint = 'https://ip-ranges.amazonaws.com/ip-ranges.json';
const { config } = require('./package');
const fs = require('fs');

const filters = [];

const download = url => new Promise(((resolve, reject) => {
  let result = '';
  https.get(url, (response) => {
    // when response still contains any data add that to result
    response.on('data', (data) => {
      result += data;
    });
    // when there is no more data in response resolve the promise
    response.on('end', () => {
      resolve(result.toString());
    });
    // when error happened, reject the promise
  }).on('error', (error) => {
    reject(error);
  });
}));

const open = url => new Promise((resolve, reject) => {
  fs.readFile(url, (error, data) => {
    if (error) {
      reject(error);
    } else {
      resolve(data.toString());
    }
  });
});

const insertData = (item, buffer) => {
  if (buffer.indexOf(item) === -1) {
    buffer.push(item);
  }
};

const filterData = (prefix, buffer) => {
  filters.forEach((filter) => {
    if (prefix[filter.Key]) {
      if (filter.Value.indexOf(prefix[filter.Key]) > -1) {
        insertData(prefix.ip_prefix, buffer);
      }
    }
  });
};

const cleanData = (prefix, buffer) => {
  buffer.push(prefix);
};

const getPrefixes = async (data) => {
  const result = [];
  try {
    const parsed = JSON.parse(data);
    parsed.prefixes.forEach((prefix) => {
      filterData(prefix, result);
    });
  } catch (error) {
    const parsed = data.split('\n');
    parsed.forEach((line) => {
      cleanData(line, result);
    });
  } finally {
    return result;
  }
};
