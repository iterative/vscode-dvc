module.exports = {
  '**/*.ts?(x)': () => 'tsc -p tsconfig.json --noEmit',
  '**/*.{js,ts,tsx}': ['eslint --cache', 'jest --bail --findRelatedTests'],
  '**/*.{md,json,yml,yaml,js,ts,tsx}': 'prettier --write'
}
