import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { sendMessage } from '../../shared/vscode'

export const showWalkthrough = () => {
  sendMessage({ type: MessageFromWebviewType.SHOW_WALKTHROUGH })
}

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

export const upgradeDvc = () => {
  sendMessage({ type: MessageFromWebviewType.UPGRADE_DVC })
}

export const updatePythonEnvironment = () => {
  sendMessage({ type: MessageFromWebviewType.UPDATE_PYTHON_ENVIRONMENT })
}

export const setupWorkspace = () => {
  sendMessage({ type: MessageFromWebviewType.SETUP_WORKSPACE })
}

export const showExperiments = () => {
  sendMessage({ type: MessageFromWebviewType.OPEN_EXPERIMENTS_WEBVIEW })
}

export const saveStudioToken = () =>
  sendMessage({ type: MessageFromWebviewType.SAVE_STUDIO_TOKEN })

export const saveStudioUrl = () =>
  sendMessage({ type: MessageFromWebviewType.SAVE_STUDIO_URL })

export const setStudioShareExperimentsLive = (shouldShareLive: boolean) =>
  sendMessage({
    payload: shouldShareLive,
    type: MessageFromWebviewType.SET_STUDIO_SHARE_EXPERIMENTS_LIVE
  })

export const removeStudioToken = () =>
  sendMessage({ type: MessageFromWebviewType.REMOVE_STUDIO_TOKEN })

export const removeStudioUrl = () =>
  sendMessage({ type: MessageFromWebviewType.REMOVE_STUDIO_URL })

export const requestStudioToken = () =>
  sendMessage({ type: MessageFromWebviewType.REQUEST_STUDIO_TOKEN })

export const addRemote = () =>
  sendMessage({ type: MessageFromWebviewType.REMOTE_ADD })

export const modifyRemote = () =>
  sendMessage({ type: MessageFromWebviewType.REMOTE_MODIFY })

export const removeRemote = () =>
  sendMessage({ type: MessageFromWebviewType.REMOTE_REMOVE })
