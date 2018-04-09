const generator = require('../generator');
const { expect } = require('chai');

const optionsMinimum = {
  gateway: '10.10.10.1',
  'administrative-distance': '',
  'out-interface': 'ether1',
  comment: '',
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
  it('Should produce Cisco config with gateway IP', () => {
    const gwOptions = Object.assign({}, optionsMinimum);
    gwOptions['out-interface'] = '';
    const ciscoConfig = 'ip route 8.8.8.8 255.255.255.0 10.10.10.1';
    expect(generator.run(ipPrefixes, Object.assign({ vendor: 'cisco' }, gwOptions))).to.be.equal(ciscoConfig);
  });
  it('Should produce Cisco config with administrative distance and tracking', () => {
    const adOptions = Object.assign({}, optionsMinimum);
    adOptions['administrative-distance'] = '20';
    adOptions.cisco.tracking = '100';
    const ciscoConfig = 'ip route 8.8.8.8 255.255.255.0 ether1 20 track 100';
    expect(generator.run(ipPrefixes, Object.assign({ vendor: 'cisco' }, adOptions))).to.be.equal(ciscoConfig);
  });
  it('Should produce Mikrotik config with minimum options', () => {
    const mkConfig = '/ip route\nadd dst-address=8.8.8.8/24 gateway=ether1';
    expect(generator.run(ipPrefixes, Object.assign({ vendor: 'mikrotik' }, optionsMinimum))).to.be.equal(mkConfig);
  });
  it('Should produce Mikrotik config with gateway IP', () => {
    const gwOptions = Object.assign({}, optionsMinimum);
    gwOptions['out-interface'] = '';
    gwOptions['administrative-distance'] = '20';
    gwOptions.comment = 'pull-to-aws';
    const mkConfig = '/ip route\nadd dst-address=8.8.8.8/24 distance=20 gateway=10.10.10.1 comment="pull-to-aws"';
    expect(generator.run(ipPrefixes, Object.assign({ vendor: 'mikrotik' }, gwOptions))).to.be.equal(mkConfig);
  });
  it('Should produce fortigate config with minimum options', () => {
    const fgConfig = 'config router static\nedit 1\nset dst 8.8.8.8/24\nset gateway 10.10.10.1\nset device ether1\nnext';
    expect(generator.run(ipPrefixes, Object.assign({ vendor: 'fortigate' }, optionsMinimum))).to.be.equal(fgConfig);
  });
  it('Should produce fortigate config with gateway IP', () => {
    const gwOptions = Object.assign({}, optionsMinimum);
    gwOptions['administrative-distance'] = '20';
    gwOptions.comment = 'pull-to-aws';
    const fgConfig = 'config router static\nedit 1\nset dst 8.8.8.8/24\nset gateway 10.10.10.1\nset distance 20\nset device ether1\nset comment "pull-to-aws"\nnext';
    expect(generator.run(ipPrefixes, Object.assign({ vendor: 'fortigate' }, gwOptions))).to.be.equal(fgConfig);
  });
});
