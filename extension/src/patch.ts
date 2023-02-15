import { commands } from 'vscode'
import omit from 'lodash.omit'
import fetch from 'node-fetch'
import {
  EXPERIMENT_WORKSPACE_ID,
  ExperimentsOutput,
  ValueTreeRoot
} from './cli/dvc/contract'
import { RegisteredCommands } from './commands/external'
import { AvailableCommands, InternalCommands } from './commands/internal'
import { Connect } from './connect'
import { Args, ExperimentFlag } from './cli/dvc/constants'
import { Toast } from './vscode/toast'

const STUDIO_ENDPOINT = 'https://studio.iterative.ai/api/live'

const getExperimentDetails = (
  shaToShare: string,
  repoUrl: string,
  expData: ExperimentsOutput
):
  | {
      baseline_sha: string
      client: string
      metrics: ValueTreeRoot | undefined
      name: string
      params: ValueTreeRoot | undefined
      plots: {}
      repo_url: string
    }
  | undefined => {
  for (const [sha, experimentsObject] of Object.entries(
    omit(expData, EXPERIMENT_WORKSPACE_ID)
  )) {
    const experiment = experimentsObject[shaToShare]

    if (experiment?.data) {
      const { metrics, params, name } = experiment?.data
      return {
        baseline_sha: sha,
        client: 'vscode',
        metrics,
        name: name as string,
        params,
        plots: {},
        repo_url: repoUrl
      }
    }
  }
}

export const registerPatchCommand = (
  internalCommands: InternalCommands,
  connect: Connect
) =>
  internalCommands.registerCommand(
    AvailableCommands.FUN,
    async (...args: Args) => {
      const [dvcRoot, sha] = args
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

      const experimentDetails = getExperimentDetails(sha, repoUrl, expData)

      if (!experimentDetails) {
        return Toast.showError(
          'Could not share experiment, unable to locate the required data'
        )
      }

      const headers = {
        Authorization: `token ${studioAccessToken}`,
        'Content-type': 'application/json'
      }

      const { metrics, params, plots, ...rest } = experimentDetails

      await fetch(STUDIO_ENDPOINT, {
        body: JSON.stringify({ ...rest, type: 'start' }),
        headers,
        method: 'POST'
      })

      await fetch(STUDIO_ENDPOINT, {
        body: JSON.stringify({
          ...rest,
          metrics,
          params,
          plots,
          step: 0,
          type: 'data'
        }),
        headers,
        method: 'POST'
      })

      await fetch(STUDIO_ENDPOINT, {
        body: JSON.stringify({ ...rest, type: 'done' }),
        headers,
        method: 'POST'
      })
    }
  )
