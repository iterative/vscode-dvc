module.exports = {
  '**/*.ts?(x)': () => 'tsc -p tsconfig.json --noEmit',
  '**/*.{js,ts,tsx}': 'eslint --cache "**/*.{js,ts,tsx}" --fix',
  '**/*.{md,json,yml,yaml,js,ts,tsx}': 'prettier --write'
}
