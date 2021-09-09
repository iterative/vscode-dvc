import { window } from 'vscode'

export const showGenericError = async (action: () => void) => {
  const option = await window.showErrorMessage(
    'Something went wrong, please see the DVC output channel for more details.',
    'Show',
    'Close'
  )
  if (option === 'Show') {
    return action()
  }
}
