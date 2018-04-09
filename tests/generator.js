const generator = require('../generator');
const { expect } = require('chai');

const optionsMinimum = {
  gateway: '10.10.10.1',
  'administrative-distance': '',
  'out-interface': 'ether1',
  comment: 'pull-to-aws',
  cisco: {
    tracking: '',
  },
  fortigate: {
    'starting-sequence': '',
  },
};

const ipPrefixes = ['8.8.8.8/24'];

describe('#Unit test for generator.js', () => {
  it('Should produce Cisco config with minimum options', () => {
    const ciscoConfig = 'ip route 8.8.8.8 255.255.255.0 ether1';
    expect(generator.run(ipPrefixes, Object.assign({ vendor: 'cisco' }, optionsMinimum))).to.be.equal(ciscoConfig);
  });
});
