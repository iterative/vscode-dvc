import { commands } from 'vscode'
import omit from 'lodash.omit'
import fetch, { Response as FetchResponse } from 'node-fetch'
import {
  EXPERIMENT_WORKSPACE_ID,
  ExperimentFields,
  ExperimentsCommitOutput,
  ExperimentsOutput,
  ValueTreeRoot
} from './cli/dvc/contract'
import { AvailableCommands, InternalCommands } from './commands/internal'
import { Args, ExperimentFlag } from './cli/dvc/constants'
import { Response as UserResponse } from './vscode/response'
import { Toast } from './vscode/toast'
import { Modal } from './vscode/modal'
import { RegisteredCommands } from './commands/external'

export const STUDIO_ENDPOINT = 'https://studio.iterative.ai/api/live'

type ExperimentDetails = {
  baselineSha: string
  metrics: ValueTreeRoot | undefined
  name: string
  params: ValueTreeRoot
}

type BaseRequestBody = {
  client: 'vscode'
  repo_url: string
  name: string
  baseline_sha: string
}

type StartRequestBody = BaseRequestBody & { type: 'start' }

type DoneRequestBody = BaseRequestBody & { type: 'done' }

type DataRequestBody = BaseRequestBody & {
  metrics: ValueTreeRoot
  params: ValueTreeRoot
  plots: ValueTreeRoot
  step: number
  type: 'data'
}

const collectExperiment = (data: ExperimentFields) => {
  const { metrics, params } = data

  const paramsAcc: ValueTreeRoot = {}
  for (const [file, fileParams] of Object.entries(params || {})) {
    const data = fileParams?.data
    if (data) {
      paramsAcc[file] = data
    }
  }

  return { metrics, params: paramsAcc }
}

const findExperimentByName = (
  name: string,
  sha: string,
  experimentsObject: ExperimentsCommitOutput
) => {
  for (const experiment of Object.values(experimentsObject)) {
    if (experiment.data?.name !== name) {
      continue
    }

    if (experiment?.data) {
      const { metrics, params } = collectExperiment(experiment.data)

      return {
        baselineSha: sha,
        metrics,
        name,
        params
      }
    }
  }
}

const collectExperimentDetails = (
  name: string,
  expData: ExperimentsOutput
): ExperimentDetails | undefined => {
  for (const [sha, experimentsObject] of Object.entries(
    omit(expData, EXPERIMENT_WORKSPACE_ID)
  )) {
    const details = findExperimentByName(name, sha, experimentsObject)
    if (details) {
      return details
    }
  }
}

const sendPostRequest = (
  studioAccessToken: string,
  body: StartRequestBody | DataRequestBody | DoneRequestBody
): Promise<FetchResponse> =>
  fetch(STUDIO_ENDPOINT, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `token ${studioAccessToken}`,
      'Content-type': 'application/json'
    },
    method: 'POST'
  })

const showUnauthorized = async () => {
  const response = await Modal.errorWithOptions(
    'The current Studio access token is invalid. Please add a new token.',
    UserResponse.SHOW
  )
  if (response === UserResponse.SHOW) {
    return commands.executeCommand(RegisteredCommands.CONNECT_SHOW)
  }
}

const shareWithProgress = (
  experimentDetails: ExperimentDetails,
  repoUrl: string,
  studioAccessToken: string
): Thenable<unknown> =>
  Toast.showProgress('Sharing Experiment', async progress => {
    const { metrics, params, baselineSha, name } = experimentDetails
    const base: BaseRequestBody = {
      baseline_sha: baselineSha,
      client: 'vscode',
      name,
      repo_url: repoUrl
    }

    progress.report({
      increment: 0,
      message: 'Initializing experiment...'
    })
    const response = await sendPostRequest(studioAccessToken, {
      ...base,
      type: 'start'
    })

    if (response.status === 401) {
      progress.report({ increment: 100, message: 'Access unauthorized' })
      void showUnauthorized()
      return Toast.delayProgressClosing()
    }

    progress.report({ increment: 33, message: 'Sending data...' })
    await sendPostRequest(studioAccessToken, {
      ...base,
      metrics: metrics || {},
      params: params || {},
      plots: {},
      step: 0,
      type: 'data'
    })

    progress.report({ increment: 33, message: 'Completing process...' })
    await sendPostRequest(studioAccessToken, { ...base, type: 'done' })

    progress.report({ increment: 33, message: 'Done' })

    return Toast.delayProgressClosing()
  })

const pushExperiment = async (
  internalCommands: InternalCommands,
  dvcRoot: string,
  name: string,
  studioAccessToken: string
) => {
  const [repoUrl, expData] = await Promise.all([
    internalCommands.executeCommand(
      AvailableCommands.GIT_GET_REMOTE_URL,
      dvcRoot
    ),
    internalCommands.executeCommand<ExperimentsOutput>(
      AvailableCommands.EXP_SHOW,
      dvcRoot,
      ExperimentFlag.NO_FETCH
    )
  ])

  const experimentDetails = collectExperimentDetails(name, expData)

  if (!repoUrl) {
    return Toast.showError(
      'Failed to share experiment, unable to generate Git repo URL'
    )
  }

  if (!experimentDetails) {
    return Toast.showError(
      'Failed to share experiment, unable to locate the required data'
    )
  }

  return shareWithProgress(experimentDetails, repoUrl, studioAccessToken)
}

export const registerPatchCommand = (internalCommands: InternalCommands) =>
  internalCommands.registerCommand(
    AvailableCommands.EXP_PUSH,
    (...args: Args) => {
      const [studioAccessToken, dvcRoot, name] = args

      return pushExperiment(internalCommands, dvcRoot, name, studioAccessToken)
    }
  )
