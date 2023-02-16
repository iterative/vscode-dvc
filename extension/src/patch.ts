import { commands } from 'vscode'
import omit from 'lodash.omit'
import fetch, { Response } from 'node-fetch'
import {
  EXPERIMENT_WORKSPACE_ID,
  ExperimentsCommitOutput,
  ExperimentsOutput,
  ValueTreeRoot
} from './cli/dvc/contract'
import { RegisteredCommands } from './commands/external'
import { AvailableCommands, InternalCommands } from './commands/internal'
import { Connect } from './connect'
import { Args, ExperimentFlag } from './cli/dvc/constants'
import { Toast } from './vscode/toast'

export const STUDIO_ENDPOINT = 'https://studio.iterative.ai/api/live'

type ExperimentDetails = {
  baselineSha: string
  metrics: ValueTreeRoot | undefined
  name: string
  params: ValueTreeRoot | undefined
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
} & { type: 'data' }

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
      const { metrics, params, name } = experiment?.data
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
): Promise<Response> =>
  fetch(STUDIO_ENDPOINT, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `token ${studioAccessToken}`,
      'Content-type': 'application/json'
    },
    method: 'POST'
  })

const sendWithProgress = (
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
    await sendPostRequest(studioAccessToken, { ...base, type: 'start' })

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

export const registerPatchCommand = (
  internalCommands: InternalCommands,
  connect: Connect
) =>
  internalCommands.registerCommand(
    AvailableCommands.EXP_PUSH,
    async (...args: Args) => {
      const [dvcRoot, name] = args
      const studioAccessToken = await connect.getStudioAccessToken()
      if (!studioAccessToken) {
        return commands.executeCommand(RegisteredCommands.CONNECT_SHOW)
      }

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

      return sendWithProgress(experimentDetails, repoUrl, studioAccessToken)
    }
  )
