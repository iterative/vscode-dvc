module.exports = {
  '**/*.{js,ts,tsx}': ['eslint --fix', 'jest --bail --findRelatedTests'],
  '**/*.{md,json,yml,yaml,js,ts,tsx}': 'prettier --write'
}
