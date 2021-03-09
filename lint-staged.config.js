module.exports = {
  '**/*.ts?(x)': () => 'tsc -p tsconfig.json --noEmit',
  '**/*.{md,json,yml,yaml,js,ts,tsx}': 'prettier --write',
  '**/*.{js,ts,tsx}': 'eslint --fix'
}
