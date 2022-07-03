module.exports = {
  '**/*.{js,ts,tsx}': [
    'eslint --fix',
    'jest --bail --findRelatedTests --passWithNoTests'
  ],
  '**/*.{js,json,jsx,md,scss,ts,tsx,yaml,yml}': 'prettier --write'
}
