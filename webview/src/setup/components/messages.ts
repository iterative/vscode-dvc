import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { sendMessage } from '../../shared/vscode'

export const checkCompatibility = () => {
  sendMessage({ type: MessageFromWebviewType.CHECK_CLI_COMPATIBLE })
}

export const initializeGit = () => {
  sendMessage({
    type: MessageFromWebviewType.INITIALIZE_GIT
  })
}

export const initializeDvc = () => {
  sendMessage({
    type: MessageFromWebviewType.INITIALIZE_DVC
  })
}

export const showScmPanel = () => {
  sendMessage({ type: MessageFromWebviewType.SHOW_SCM_PANEL })
}

export const installDvc = () => {
  sendMessage({ type: MessageFromWebviewType.INSTALL_DVC })
}

export const selectPythonInterpreter = () => {
  sendMessage({ type: MessageFromWebviewType.SELECT_PYTHON_INTERPRETER })
}

export const setupWorkspace = () => {
  sendMessage({ type: MessageFromWebviewType.SETUP_WORKSPACE })
}
