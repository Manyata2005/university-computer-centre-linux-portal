const fs = require('fs');
const window = {
  document: { createElement: () => ({ getContext: () => null }) },
  addEventListener: () => {},
  navigator: { userAgent: 'test' }
};
const self = window;
const globalThis = window;
eval(fs.readFileSync('three.min.js', 'utf8'));
console.log('Browser simulation typeof THREE:', typeof window.THREE, 'Revision:', window.THREE ? window.THREE.REVISION : 'undefined');