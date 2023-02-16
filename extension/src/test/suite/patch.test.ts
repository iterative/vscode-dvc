import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { restore, spy, stub } from 'sinon'
import { expect } from 'chai'
import { commands } from 'vscode'
import * as Fetch from 'node-fetch'
import { buildInternalCommands, closeAllEditors } from './util'
import { PROGRESS_TEST_TIMEOUT } from './timeouts'
import { buildConnect } from './connect/util'
import { Disposable } from '../../extension'
import { STUDIO_ENDPOINT, registerPatchCommand } from '../../patch'
import { AvailableCommands } from '../../commands/internal'
import { RegisteredCommands } from '../../commands/external'
import expShowFixture from '../fixtures/expShow/base/output'
import { dvcDemoPath } from '../util'
import { STUDIO_ACCESS_TOKEN_KEY } from '../../connect/token'
import { ExperimentFields } from '../../cli/dvc/contract'
import { Toast } from '../../vscode/toast'

suite('Patch Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(function () {
    disposable.dispose()
    return closeAllEditors()
  })

  describe('exp push patch', () => {
    const buildMockSecretStorage = (mockStudioAccessToken: string) => ({
      delete: stub(),
      get: (key: string) => {
        if (key === STUDIO_ACCESS_TOKEN_KEY) {
          return Promise.resolve(mockStudioAccessToken)
        }
        return Promise.resolve(undefined)
      },
      onDidChange: stub(),
      store: stub()
    })

    it('should show the connect webview if a Studio access token is not present in secret storage', async () => {
      const { internalCommands } = buildInternalCommands(disposable)
      const { connect } = await buildConnect(disposable)

      registerPatchCommand(internalCommands, connect)
      const executeCommandSpy = spy(commands, 'executeCommand')

      await internalCommands.executeCommand(AvailableCommands.EXP_PUSH)

      expect(executeCommandSpy).to.be.calledWithExactly(
        RegisteredCommands.CONNECT_SHOW
      )
    })

    it('should share an experiment to studio if a Studio access token is present', async () => {
      const mockFetch = stub(Fetch, 'default').resolves(undefined)
      const mockStudioAccessToken = 'isat_12123123123123123'
      const mockRepoUrl = 'https://github.com/iterative/vscode-dvc-demo'

      const mockSecretStorage = buildMockSecretStorage(mockStudioAccessToken)

      const { internalCommands, gitReader, dvcReader } =
        buildInternalCommands(disposable)
      const { connect } = await buildConnect(disposable, mockSecretStorage)

      const mockGetRemoteUrl = stub(gitReader, 'getRemoteUrl').resolves(
        mockRepoUrl
      )
      const mockExpShow = stub(dvcReader, 'expShow').resolves(expShowFixture)

      registerPatchCommand(internalCommands, connect)

      await internalCommands.executeCommand(
        AvailableCommands.EXP_PUSH,
        dvcDemoPath,
        'exp-e7a67'
      )

      expect(mockGetRemoteUrl).to.be.calledOnce
      expect(mockExpShow).to.be.calledOnce
      expect(mockFetch).to.be.calledThrice

      const { metrics, params, name } = expShowFixture[
        '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77'
      ]['4fb124aebddb2adf1545030907687fa9a4c80e70'].data as ExperimentFields

      const baseBody = {
        baseline_sha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
        client: 'vscode',
        name,
        repo_url: mockRepoUrl
      }
      const headers = {
        Authorization: `token ${mockStudioAccessToken}`,
        'Content-type': 'application/json'
      }

      expect(mockFetch).to.be.calledWithExactly(STUDIO_ENDPOINT, {
        body: JSON.stringify({ ...baseBody, type: 'start' }),
        headers,
        method: 'POST'
      })

      expect(mockFetch).to.be.calledWithExactly(STUDIO_ENDPOINT, {
        body: JSON.stringify({
          ...baseBody,
          metrics,
          name,
          params,
          plots: {},
          step: 0,
          type: 'data'
        }),
        headers,
        method: 'POST'
      })

      expect(mockFetch).to.be.calledWithExactly(STUDIO_ENDPOINT, {
        body: JSON.stringify({ ...baseBody, type: 'done' }),
        headers,
        method: 'POST'
      })
    }).timeout(PROGRESS_TEST_TIMEOUT)

    it('should show an error message if the experiment cannot be found', async () => {
      const mockShowError = stub(Toast, 'showError').resolves(undefined)

      const mockStudioAccessToken = 'isat_not-needed'
      const mockRepoUrl = 'https://github.com/iterative/vscode-dvc-demo'

      const mockSecretStorage = buildMockSecretStorage(mockStudioAccessToken)

      const { internalCommands, gitReader, dvcReader } =
        buildInternalCommands(disposable)
      const { connect } = await buildConnect(disposable, mockSecretStorage)

      const mockGetRemoteUrl = stub(gitReader, 'getRemoteUrl').resolves(
        mockRepoUrl
      )
      const mockExpShow = stub(dvcReader, 'expShow').resolves(expShowFixture)

      registerPatchCommand(internalCommands, connect)

      await internalCommands.executeCommand(
        AvailableCommands.EXP_PUSH,
        dvcDemoPath,
        'not-an-experiment'
      )

      expect(mockGetRemoteUrl).to.be.calledOnce
      expect(mockExpShow).to.be.calledOnce
      expect(mockShowError).to.be.calledOnce
    })
  })
})
