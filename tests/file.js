const downloader = require('../file');
const { expect } = require('chai');
const sinon = require('sinon');
const { PassThrough } = require('stream');

// define these two modules so it can be stubbed by sinon
const https = require('https');
const fs = require('fs');

const testFileInput = [
  '172.16.28.0/24', 'empty', 'routes:172.18.78.0/26', '# 202.128.239.0/29', '// 202.128.239.0/27', '172.16.28.0/24',
];

const testFileOutput = [
  '172.16.28.0/24', '172.18.78.0/26',
];

const testJSONInput = require('./test-range.json');

const testFilter = [
  {
    Key: 'region',
    Values: [
      'ap-southeast-1',
      'ap-southeast-2',
    ],
  },
  {
    Key: 'name',
    Values: ['dummy'],
  },
];

const testJSONOutputFiltered = ['13.228.0.0/15', '13.210.0.0/15'];

const testJSONOutput = ['13.228.0.0/15', '13.230.0.0/15', '13.210.0.0/15', '18.194.0.0/15'];

const getStream = (input) => {
  const data = input ? JSON.stringify(input) : '';
  const response = new PassThrough();
  response.write(data);
  response.end();
  return response;
};

describe('#Unit test for file.js', () => {
  //   Before each test (it) create sinon stub
  beforeEach(() => {
    this.urlDownloader = sinon.stub(https, 'get');
    this.fileReader = sinon.stub(fs, 'readFile');
  });
  //   After each test restore stubbed function to its original function
  afterEach(() => {
    this.urlDownloader.restore();
    this.fileReader.restore();
  });
  it('Should read from file', (done) => {
    this.fileReader.callsArgWith(1, null, testFileInput.join('\n'));
    downloader.getData('./test.txt', []).then((result) => {
      expect(result).to.be.deep.equal(testFileOutput);
      done();
    });
  });
  it('Should read from url and return data unfiltered', (done) => {
    this.urlDownloader.callsArgWith(1, getStream(testJSONInput)).returns(new PassThrough());
    downloader.getData('https://ip-ranges.amazonaws.com/ip-ranges.json').then((result) => {
      expect(result).to.be.deep.equal(testJSONOutput);
      done();
    });
  });
  it('Should read from url and return data filtered', (done) => {
    this.urlDownloader.callsArgWith(1, getStream(testJSONInput)).returns(new PassThrough());
    downloader.getData('https://ip-ranges.amazonaws.com/ip-ranges.json', testFilter).then((result) => {
      expect(result).to.be.deep.equal(testJSONOutputFiltered);
      done();
    });
  });
  it('Should throw error when an error occurred during file downloading', (done) => {
    const response = new PassThrough();
    const expectedError = 'Something went wrong';
    this.urlDownloader.returns(response);
    downloader.getData('https://ip-ranges.amazonaws.com/ip-ranges.json', testFilter).catch((error) => {
      expect(error).to.be.equal(expectedError);
      done();
    });
    response.emit('error', expectedError);
  });
  it('Should throw error when failed in reading file', (done) => {
    const message = 'Something went wrong';
    this.fileReader.callsArgWith(1, new Error(message), null);
    downloader.getData('./test.txt', []).catch((error) => {
      expect(error.message).to.be.equal(message);
      done();
    });
  });
});
