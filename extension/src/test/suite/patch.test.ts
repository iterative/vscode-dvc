import { join } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { restore, spy, stub } from 'sinon'
import { expect } from 'chai'
import * as Fetch from 'node-fetch'
import { commands } from 'vscode'
import {
  buildInternalCommands,
  bypassProgressCloseDelay,
  closeAllEditors
} from './util'
import { Disposable } from '../../extension'
import { STUDIO_ENDPOINT, registerPatchCommand } from '../../patch'
import { AvailableCommands } from '../../commands/internal'
import expShowFixture from '../fixtures/expShow/base/output'
import { dvcDemoPath } from '../util'
import { ExperimentFields } from '../../cli/dvc/contract'
import { Toast } from '../../vscode/toast'
import { Modal } from '../../vscode/modal'
import { Response } from '../../vscode/response'
import { RegisteredCommands } from '../../commands/external'

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
    it('should share an experiment to Studio', async () => {
      bypassProgressCloseDelay()
      const mockFetch = stub(Fetch, 'default').resolves({} as Fetch.Response)
      const mockStudioAccessToken = 'isat_12123123123123123'
      const mockRepoUrl = 'https://github.com/iterative/vscode-dvc-demo'

      const { internalCommands, gitReader, dvcReader } =
        buildInternalCommands(disposable)

      const mockGetRemoteUrl = stub(gitReader, 'getRemoteUrl').resolves(
        mockRepoUrl
      )
      const mockExpShow = stub(dvcReader, 'expShow').resolves(expShowFixture)

      registerPatchCommand(internalCommands)

      await internalCommands.executeCommand(
        AvailableCommands.EXP_PUSH,
        mockStudioAccessToken,
        dvcDemoPath,
        'exp-e7a67'
      )

      expect(mockGetRemoteUrl).to.be.calledOnce
      expect(mockExpShow).to.be.calledOnce
      expect(mockFetch).to.be.calledOnce

      const { metrics, name, params } = expShowFixture[
        '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77'
      ]['4fb124aebddb2adf1545030907687fa9a4c80e70'].data as ExperimentFields

      expect(mockFetch).to.be.calledWithExactly(STUDIO_ENDPOINT, {
        body: JSON.stringify({
          baseline_sha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
          client: 'vscode',
          metrics,
          name,
          params: {
            'params.yaml': params?.['params.yaml']?.data,
            [join('nested', 'params.yaml')]:
              params?.[join('nested', 'params.yaml')]?.data
          },
          repo_url: mockRepoUrl,
          type: 'done'
        }),
        headers: {
          Authorization: `token ${mockStudioAccessToken}`,
          'Content-type': 'application/json'
        },
        method: 'POST'
      })
    })

    it('should show an error modal if Studio returns a 401 response', async () => {
      bypassProgressCloseDelay()
      const mockFetch = stub(Fetch, 'default').resolves({
        status: 401
      } as Fetch.Response)
      const mockStudioAccessToken = 'isat_12123123123123123'
      const mockRepoUrl = 'https://github.com/iterative/vscode-dvc-demo'

      const executeCommandSpy = spy(commands, 'executeCommand')

      const { internalCommands, gitReader, dvcReader } =
        buildInternalCommands(disposable)

      const mockGetRemoteUrl = stub(gitReader, 'getRemoteUrl').resolves(
        mockRepoUrl
      )
      const mockExpShow = stub(dvcReader, 'expShow').resolves(expShowFixture)

      const mockErrorWithOptions = stub(Modal, 'errorWithOptions').resolves(
        Response.SHOW
      )

      registerPatchCommand(internalCommands)

      await internalCommands.executeCommand(
        AvailableCommands.EXP_PUSH,
        mockStudioAccessToken,
        dvcDemoPath,
        'exp-e7a67'
      )

      expect(mockGetRemoteUrl).to.be.calledOnce
      expect(mockExpShow).to.be.calledOnce
      expect(mockFetch).to.be.calledOnce
      expect(mockErrorWithOptions).to.be.calledOnce
      expect(executeCommandSpy).to.be.calledWithExactly(
        RegisteredCommands.CONNECT_SHOW
      )

      const { metrics, params, name } = expShowFixture[
        '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77'
      ]['4fb124aebddb2adf1545030907687fa9a4c80e70'].data as ExperimentFields

      expect(mockFetch).to.be.calledWithExactly(STUDIO_ENDPOINT, {
        body: JSON.stringify({
          baseline_sha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
          client: 'vscode',
          metrics,
          name,
          params: {
            'params.yaml': params?.['params.yaml']?.data,
            [join('nested', 'params.yaml')]:
              params?.[join('nested', 'params.yaml')]?.data
          },
          repo_url: mockRepoUrl,
          type: 'done'
        }),
        headers: {
          Authorization: `token ${mockStudioAccessToken}`,
          'Content-type': 'application/json'
        },
        method: 'POST'
      })
    })

    it('should show an error message if the experiment cannot be found', async () => {
      const mockShowError = stub(Toast, 'showError').resolves(undefined)

      const mockStudioAccessToken = 'isat_not-needed'
      const mockRepoUrl = 'https://github.com/iterative/vscode-dvc-demo'

      const { internalCommands, gitReader, dvcReader } =
        buildInternalCommands(disposable)

      const mockGetRemoteUrl = stub(gitReader, 'getRemoteUrl').resolves(
        mockRepoUrl
      )
      const mockExpShow = stub(dvcReader, 'expShow').resolves(expShowFixture)

      registerPatchCommand(internalCommands)

      await internalCommands.executeCommand(
        AvailableCommands.EXP_PUSH,
        mockStudioAccessToken,
        dvcDemoPath,
        'not-an-experiment'
      )

      expect(mockGetRemoteUrl).to.be.calledOnce
      expect(mockGetRemoteUrl).to.be.calledWith(dvcDemoPath)
      expect(mockExpShow).to.be.calledOnce
      expect(mockExpShow).to.be.calledWithExactly(dvcDemoPath, '--no-fetch')
      expect(mockShowError).to.be.calledOnce
    })
  })
})
