module.exports = {
  '**/*.ts?(x)': () => 'tsc -p tsconfig.json --noEmit',
  '**/*.{js,ts,tsx}': 'eslint --fix',
  '**/*.{md,json,yml,yaml,js,ts,tsx}': 'prettier --write'
}
