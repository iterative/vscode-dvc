module.exports = {
  extends: 'stylelint-config-standard-scss',
  rules: {
    'max-nesting-depth': 2,
    'selector-max-attribute': 2,
    'selector-max-class': 2,
    'selector-max-combinators': 3,
    'selector-max-type': 2,
    'selector-pseudo-class-no-unknown': [
      true,
      { ignorePseudoClasses: ['global'] }
    ],
    'custom-property-pattern': null,
    'selector-class-pattern': null,
    'scss/percent-placeholder-pattern': null,
    'scss/dollar-variable-empty-line-before': [
      'always',
      {
        except: ['after-comment', 'after-dollar-variable']
      }
    ]
  }
}
