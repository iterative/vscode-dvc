import { basename, extname } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { window } from 'vscode'
import { getConfigValue, setUserConfigValue } from './config'
import { getShowOrCloseOrNever, getYesOrNoOrNever } from './toast'
import { Response } from './response'
import { isAvailable, showExtension } from './extensions'

const FILE_ASSOCIATION_ID = 'files.associations'
const YAML_SCHEMAS_ID = 'yaml.schemas'
const DO_NOT_ASSOCIATE_YAML = 'dvc.doNotAssociateYaml'
const DO_NOT_ADD_DVC_YAML_SCHEMA = 'dvc.doNotAddDvcYamlSchema'
const DO_NOT_RECOMMEND_RED_HAT = 'dvc.doNotRecommendRedHat'
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

const getCurrentYamlSchemas = () =>
  getConfigValue<Record<string, string> | undefined>(YAML_SCHEMAS_ID) || {}

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

  return setUserConfigValue(YAML_SCHEMAS_ID, yamlSchemas)
}

export const recommendAddDvcYamlSchema = async () => {
  const response = await getYesOrNoOrNever(
    'Would you like to add [DVC YAML schema validation](https://github.com/iterative/dvcyaml-schema)?'
  )

  if (response === Response.YES) {
    return addDvcYamlSchema()
  }

  if (response === Response.NEVER) {
    return setUserConfigValue(DO_NOT_ADD_DVC_YAML_SCHEMA, true)
  }
}

const isDvcYaml = (fileName?: string): boolean =>
  !!(fileName && basename(fileName) === 'dvc.yaml')

export const recommendAddDvcYamlSchemaOnce = (): Disposable => {
  const singleUseListener = window.onDidChangeActiveTextEditor(editor => {
    if (alreadyHasSchema() || getConfigValue(DO_NOT_ADD_DVC_YAML_SCHEMA)) {
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
