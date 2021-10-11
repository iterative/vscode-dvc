import { basename, extname } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { window } from 'vscode'
import { getConfigValue, setUserConfigValue } from './config'

const fileAssociationsKey = 'files.associations'
const doNotAssociateYaml = 'dvc.doNotAssociateYaml'

const getCurrentFileAssociations = () =>
  getConfigValue<Record<string, string> | undefined>(fileAssociationsKey) || {}

const addFileAssociations = () => {
  const fileAssociations = Object.assign(getCurrentFileAssociations(), {
    '*.dvc': 'yaml',
    'dvc.lock': 'yaml'
  })

  return setUserConfigValue('files.associations', fileAssociations)
}

export const askUserToAssociateYaml = async () => {
  const response = await window.showInformationMessage(
    'Would you like to associate files with the ".dvc" extension and "dvc.lock" files with yaml',
    'Yes',
    'No',
    "Don't Show Again"
  )

  if (response === 'Yes') {
    return addFileAssociations()
  }

  if (response === "Don't Show Again") {
    return setUserConfigValue(doNotAssociateYaml, true)
  }
}

const isFileType = (fileName?: string): boolean =>
  !!(
    fileName &&
    (basename(fileName) === 'dvc.lock' || extname(fileName) === '.dvc')
  )

const alreadyAssociated = (): boolean => {
  const currentFileAssociations = getCurrentFileAssociations()
  return !!(
    currentFileAssociations['*.dvc'] && currentFileAssociations['dvc.lock']
  )
}

export const tryAssociateYamlOnce = (): Disposable => {
  const singleUseListener = window.onDidChangeActiveTextEditor(async editor => {
    const fileName = editor?.document.fileName

    if (isFileType(fileName)) {
      if (alreadyAssociated() || getConfigValue(doNotAssociateYaml)) {
        return
      }

      await askUserToAssociateYaml()
      singleUseListener.dispose()
    }
  })
  return singleUseListener
}
