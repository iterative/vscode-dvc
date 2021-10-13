import { basename, extname } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { window } from 'vscode'
import { getConfigValue, setUserConfigValue } from './config'
import { getShowOrCloseOrNever, getYesOrNoOrNever } from './toast'
import { Response } from './response'
import { isAvailable, showExtension } from './extensions'

const FILE_ASSOCIATION_ID = 'files.associations'
const DO_NOT_ASSOCIATE_YAML = 'dvc.doNotAssociateYaml'
const DO_NOT_RECOMMEND_RED_HAT = 'dvc.doNotRecommendRedHatExtension'
const RED_HAT_EXTENSION_ID = 'redhat.vscode-yaml'

const getCurrentFileAssociations = () =>
  getConfigValue<Record<string, string> | undefined>(FILE_ASSOCIATION_ID) || {}

const addFileAssociations = () => {
  const fileAssociations = Object.assign(getCurrentFileAssociations(), {
    '*.dvc': 'yaml',
    'dvc.lock': 'yaml'
  })

  return setUserConfigValue(FILE_ASSOCIATION_ID, fileAssociations)
}

export const recommendAssociateYaml = async () => {
  const response = await getYesOrNoOrNever(
    'Would you like to have "dvc.lock" and ".dvc" files recognized as YAML?'
  )

  if (response === Response.YES) {
    return addFileAssociations()
  }

  if (response === Response.NEVER) {
    return setUserConfigValue(DO_NOT_ASSOCIATE_YAML, true)
  }
}

const isDvcLockOrDotDvc = (fileName?: string): boolean =>
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

export const recommendAssociateYamlOnce = (): Disposable => {
  const singleUseListener = window.onDidChangeActiveTextEditor(editor => {
    if (alreadyAssociated() || getConfigValue(DO_NOT_ASSOCIATE_YAML)) {
      return singleUseListener.dispose()
    }

    if (isDvcLockOrDotDvc(editor?.document.fileName)) {
      recommendAssociateYaml()
      return singleUseListener.dispose()
    }
  })
  return singleUseListener
}

const isAnyDvcYaml = (fileName?: string) =>
  isDvcLockOrDotDvc(fileName) ||
  !!(fileName && basename(fileName) === 'dvc.yaml')

export const recommendRedHatExtension = async () => {
  const response = await getShowOrCloseOrNever(
    'It is recommended that you install the ' +
      '[Red Hat YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) ' +
      'extension for comprehensive YAML Language support and [DVC YAML schema validation](https://github.com/iterative/dvcyaml-schema).'
  )

  if (response === Response.SHOW) {
    return showExtension(RED_HAT_EXTENSION_ID)
  }

  if (response === Response.NEVER) {
    return setUserConfigValue(DO_NOT_RECOMMEND_RED_HAT, true)
  }
}

export const recommendRedHatExtensionOnce = (): Disposable => {
  const singleUseListener = window.onDidChangeActiveTextEditor(editor => {
    if (
      isAvailable(RED_HAT_EXTENSION_ID) ||
      getConfigValue(DO_NOT_RECOMMEND_RED_HAT)
    ) {
      return singleUseListener.dispose()
    }

    if (isAnyDvcYaml(editor?.document.fileName)) {
      recommendRedHatExtension()
      return singleUseListener.dispose()
    }
  })
  return singleUseListener
}
