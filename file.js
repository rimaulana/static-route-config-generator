const https = require('https');

const fs = require('fs');

let filters = [];

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
  // if no filter defined then put all data into result
  if (filters.length === 0) {
    insertData(prefix.ip_prefix, buffer);
  }
  // if there is filter, check data against filter
  let matched = 0;
  filters.forEach((filter) => {
    if (prefix[filter.Key]) {
      if (filter.Values.indexOf(prefix[filter.Key]) > -1) {
        matched += 1;
      }
    }
  });

  if (matched > 0) {
    insertData(prefix.ip_prefix, buffer);
  }
};

const cleanData = (prefix, buffer) => {
  const regexCommented = new RegExp('(?:#|\\/\\/).*');
  const regexIPPrefix = new RegExp('\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}(?:\\s+)?\\/(?:\\s+)?\\d{1,2}');
  // return empty string when line is commented or remove comment
  const clean = prefix.replace(regexCommented, '');
  // find for IP Prefix pattern
  const matched = clean.match(regexIPPrefix);
  if (matched) {
    insertData(matched[0], buffer);
  }
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

const getData = (url, inputFilter = []) => new Promise((resolve, reject) => {
  const urlRegex = new RegExp('(http[s]?:\\/\\/)([^\\/\\s]+\\/)(.*)');
  const data = url.match(urlRegex) ? download(url) : open(url);
  filters = inputFilter;
  data
    .then(getPrefixes)
    .then((result) => {
      resolve(result);
    })
    .catch((error) => {
      reject(error);
    });
});

module.exports = {
  getData,
};
