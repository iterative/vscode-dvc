import { commands } from 'vscode'
import fetch, { Response as FetchResponse } from 'node-fetch'
import {
  ExpData,
  ExpRange,
  ExpShowOutput,
  ExpState,
  ValueTree,
  MetricsOrParams,
  experimentHasError,
  fileHasError
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
  sha: string
  metrics: MetricsOrParams | undefined | null
  name: string
  params: ValueTree | null
}

type RequestBody = {
  client: 'vscode'
  repo_url: string
  name: string
  baseline_sha: string
  experiment_rev: string
  metrics: MetricsOrParams
  params: ValueTree
  type: 'done'
}

const collectExperiment = (data: ExpData) => {
  const { metrics, params } = data

  const paramsAcc: ValueTree = {}
  for (const [file, fileParams] of Object.entries(params || {})) {
    if (fileHasError(fileParams)) {
      continue
    }
    const data = fileParams?.data
    if (data) {
      paramsAcc[file] = data
    }
  }

  return { metrics, params: paramsAcc }
}

const findExperimentByName = (
  name: string,
  expState: ExpState & { experiments?: ExpRange[] | null }
  // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
  if (!expState.experiments) {
    return
  }

  for (const experiment of expState.experiments) {
    if (experiment.name !== name) {
      continue
    }

    const [exp] = experiment.revs
    if (experimentHasError(exp)) {
      return
    }

    const { data, rev } = exp

    if (data) {
      const { metrics, params } = collectExperiment(data)

      return {
        baselineSha: expState.rev,
        metrics,
        name,
        params,
        sha: rev
      }
    }
  }
}

const collectExperimentDetails = (
  name: string,
  expData: ExpShowOutput
): ExperimentDetails | undefined => {
  for (const expState of expData.slice(1)) {
    const details = findExperimentByName(name, expState)
    if (details) {
      return details
    }
  }
}

const sendPostRequest = (
  studioAccessToken: string,
  body: RequestBody
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
    return commands.executeCommand(RegisteredCommands.SETUP_SHOW)
  }
}

const shareWithProgress = (
  experimentDetails: ExperimentDetails,
  repoUrl: string,
  studioAccessToken: string
): Thenable<unknown> =>
  Toast.showProgress('Sharing Experiment', async progress => {
    const { metrics, params, baselineSha, sha, name } = experimentDetails

    progress.report({
      increment: 0,
      message: 'Initializing experiment...'
    })

    progress.report({ increment: 50, message: 'Sending data...' })
    const response = await sendPostRequest(studioAccessToken, {
      baseline_sha: baselineSha,
      client: 'vscode',
      experiment_rev: sha,
      metrics: metrics || {},
      name,
      params: params || {},
      repo_url: repoUrl,
      type: 'done'
    })

    progress.report({ increment: 25, message: 'Response received...' })

    if (response.status === 401) {
      progress.report({ increment: 25, message: 'Access unauthorized' })
      void showUnauthorized()
      return Toast.delayProgressClosing()
    }

    progress.report({ increment: 25, message: 'Done' })

    return Toast.delayProgressClosing()
  })

const pushExperiment = async (
  internalCommands: InternalCommands,
  dvcRoot: string,
  name: string,
  studioAccessToken: string
) => {
  const [repoUrl, expShowOutput] = await Promise.all([
    internalCommands.executeCommand(
      AvailableCommands.GIT_GET_REMOTE_URL,
      dvcRoot
    ),
    internalCommands.executeCommand<ExpShowOutput>(
      AvailableCommands.EXP_SHOW,
      dvcRoot,
      ExperimentFlag.NO_FETCH
    )
  ])

  const experimentDetails = collectExperimentDetails(name, expShowOutput)

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
