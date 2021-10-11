import { basename, extname } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { window } from 'vscode'
import { getConfigValue, setUserConfigValue } from './config'
import { getYesOrNoOrNever } from './toast'
import { Response } from './response'

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
  const response = await getYesOrNoOrNever(
    'Would you like to associate files with the ".dvc" extension and "dvc.lock" files with yaml'
  )

  if (response === Response.yes) {
    return addFileAssociations()
  }

  if (response === Response.never) {
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
  const singleUseListener = window.onDidChangeActiveTextEditor(editor => {
    if (alreadyAssociated() || getConfigValue(doNotAssociateYaml)) {
      return singleUseListener.dispose()
    }

    if (isFileType(editor?.document.fileName)) {
      askUserToAssociateYaml()
      return singleUseListener.dispose()
    }
  })
  return singleUseListener
}
