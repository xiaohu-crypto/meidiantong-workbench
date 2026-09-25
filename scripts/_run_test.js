var PAGES = {};
try {
  eval(require('fs').readFileSync('_growth_test.js', 'utf8'));
  console.log('OK len=', PAGES.growth.length);
} catch (e) {
  console.log('ERR:', e.message);
  console.log(e.stack.split('\n').slice(0,5).join('\n'));
}
