const baseLintStaged = require('../.lintstagedrc')

module.exports = {
  ...baseLintStaged,
  '**/*.scss': 'stylelint --fix'
}
