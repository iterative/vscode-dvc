import { readFileSync, writeFileSync } from 'fs'
import { copyOriginalColors } from 'dvc/src/experiments/model/status/colors'

const colors = copyOriginalColors()

const addSpin = (file: string) =>
  file.replace(
    /(?=<\/svg>)/,
    '\n<animateTransform attributeType="xml" attributeName="transform" type="rotate" ' +
      'values="0 0 0; 25 00; 40 0 0; 80 0 0; 100 0 0; 205 0 0; 260 0 0; 288 0 0; 342 0 0; 360 0 0" dur="1s" repeatCount="indefinite"/>' +
      '\n'
  )

const writeSpinner = (loadingIcon: string, color: string) => {
  const spinner = addSpin(loadingIcon)

  writeFileSync(
    `./extension/resources/experiments/loading-spin-${color}.svg`,
    spinner
  )
}

;['loading', 'circle-filled'].map(iconName => {
  const icon = readFileSync(
    `./node_modules/@vscode/codicons/src/icons/${iconName}.svg`
  )

  colors.map(color => {
    const newIcon = icon.toString().replace(/(?<=d=".*?")/, ` fill="${color}"`)

    if (iconName === 'loading') {
      return writeSpinner(newIcon, color)
    }

    writeFileSync(
      `./extension/resources/experiments/${iconName}-${color}.svg`,
      newIcon
    )
  })
})
