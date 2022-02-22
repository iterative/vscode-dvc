import { Disposable } from '@hediet/std/disposable'
import { window } from 'vscode'
import { getConfigValue, setUserConfigValue } from './config'
import { Toast } from './toast'
import { Response } from './response'
import { isInstalled, showExtension } from './extensions'
import { isAnyDvcYaml } from '../fileSystem'

const DO_NOT_RECOMMEND_RED_HAT = 'dvc.doNotRecommendRedHatExtension'
const RED_HAT_EXTENSION_ID = 'redhat.vscode-yaml'

export const recommendRedHatExtension = async () => {
  const response = await Toast.askShowOrCloseOrNever(
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
      isInstalled(RED_HAT_EXTENSION_ID) ||
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
