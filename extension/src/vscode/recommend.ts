import { basename, extname } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { commands, window } from 'vscode'
import { getConfigValue, setUserConfigValue } from './config'
import { getShowOrCloseOrNever, getYesOrNoOrNever } from './toast'
import { Response } from './response'
import { isAvailable } from './extensions'

const fileAssociationsKey = 'files.associations'
const yamlSchemasKey = 'yaml.schemas'
const doNotAssociateYaml = 'dvc.doNotAssociateYaml'
const doNotAddDvcYamlSchema = 'dvc.doNotAddDvcYamlSchema'
const doNotRecommendRedHat = 'dvc.doNotRecommendRedHat'

const getCurrentFileAssociations = () =>
  getConfigValue<Record<string, string> | undefined>(fileAssociationsKey) || {}

const addFileAssociations = () => {
  const fileAssociations = Object.assign(getCurrentFileAssociations(), {
    '*.dvc': 'yaml',
    'dvc.lock': 'yaml'
  })

  return setUserConfigValue(fileAssociationsKey, fileAssociations)
}

export const recommendAssociateYaml = async () => {
  const response = await getYesOrNoOrNever(
    'Would you like to have "dvc.lock" and ".dvc" files recognized as YAML?'
  )

  if (response === Response.YES) {
    return addFileAssociations()
  }

  if (response === Response.NEVER) {
    return setUserConfigValue(doNotAssociateYaml, true)
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
    if (alreadyAssociated() || getConfigValue(doNotAssociateYaml)) {
      return singleUseListener.dispose()
    }

    if (isDvcLockOrDotDvc(editor?.document.fileName)) {
      recommendAssociateYaml()
      return singleUseListener.dispose()
    }
  })
  return singleUseListener
}

const getCurrentYamlSchemas = () =>
  getConfigValue<Record<string, string> | undefined>(yamlSchemasKey) || {}

const alreadyHasSchema = (): boolean => {
  const yamlSchemas = getCurrentYamlSchemas()
  return !!yamlSchemas[
    'https://raw.githubusercontent.com/iterative/dvcyaml-schema/master/schema.json'
  ]?.includes('dvc.yaml')
}

const addDvcYamlSchema = () => {
  const yamlSchemas = Object.assign(getCurrentFileAssociations(), {
    'https://raw.githubusercontent.com/iterative/dvcyaml-schema/master/schema.json':
      'dvc.yaml'
  })

  return setUserConfigValue(yamlSchemasKey, yamlSchemas)
}

export const recommendAddDvcYamlSchema = async () => {
  const response = await getYesOrNoOrNever(
    'Would you like to add [DVC YAML schema validation](https://github.com/iterative/dvcyaml-schema)?'
  )

  if (response === Response.YES) {
    return addDvcYamlSchema()
  }

  if (response === Response.NEVER) {
    return setUserConfigValue(doNotAddDvcYamlSchema, true)
  }
}

const isDvcYaml = (fileName?: string): boolean =>
  !!(fileName && basename(fileName) === 'dvc.yaml')

export const recommendAddDvcYamlSchemaOnce = (): Disposable => {
  const singleUseListener = window.onDidChangeActiveTextEditor(editor => {
    if (alreadyHasSchema() || getConfigValue(doNotAddDvcYamlSchema)) {
      return singleUseListener.dispose()
    }

    if (isDvcYaml(editor?.document.fileName)) {
      recommendAddDvcYamlSchema()
      return singleUseListener.dispose()
    }
  })
  return singleUseListener
}

const isAnyDvcYaml = (fileName?: string) =>
  isDvcLockOrDotDvc(fileName) || isDvcYaml(fileName)

export const recommendRedHatExtension = async () => {
  const response = await getShowOrCloseOrNever(
    'It is recommended that you install the ' +
      '[Red Hat YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) ' +
      'extension for comprehensive YAML Language support.'
  )

  if (response === Response.SHOW) {
    return commands.executeCommand(
      'workbench.extensions.search',
      '@id:redhat.vscode-yaml'
    )
  }

  if (response === Response.NEVER) {
    return setUserConfigValue(doNotRecommendRedHat, true)
  }
}

export const recommendRedHatExtensionOnce = (): Disposable => {
  const singleUseListener = window.onDidChangeActiveTextEditor(editor => {
    if (
      isAvailable('redhat.vscode-yaml') ||
      getConfigValue(doNotRecommendRedHat)
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
