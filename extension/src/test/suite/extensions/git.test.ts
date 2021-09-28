import { resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { EventEmitter } from 'vscode'
import { restore, spy } from 'sinon'
import { Disposable } from '../../../extension'
import {
  APIState,
  getGitRepositoryRoots,
  isReady
} from '../../../extensions/git'

suite('Git Extension Test Suite', () => {
  const workspacePath = resolve(__dirname, '..', '..', '..', '..', '..')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('getGitRepositoryRoots', () => {
    it('should be able to return the root path of each open repository', async () => {
      const gitRoots = await getGitRepositoryRoots()
      const [gitRoot] = gitRoots
      expect(gitRoot).to.equal(workspacePath)
    })
  })

  describe('isReady', () => {
    const mockAPIStatusChanged = new EventEmitter<APIState>()
    const mockGitExtensionAPi = {
      onDidChangeState: mockAPIStatusChanged.event,
      repositories: [],
      state: APIState.INITIALIZED
    }

    it('should return if the extension is initialized', async () => {
      mockGitExtensionAPi.state = APIState.INITIALIZED
      const onDidChangeStateSpy = spy(mockGitExtensionAPi, 'onDidChangeState')

      expect(mockGitExtensionAPi.state).to.equal(APIState.INITIALIZED)

      const resolved = await isReady(mockGitExtensionAPi)

      expect(onDidChangeStateSpy).to.be.calledOnce
      expect(resolved).to.be.undefined
    })

    it('should return after the extension becomes initialized (if uninitialized)', async () => {
      const onDidChangeStateSpy = spy(mockGitExtensionAPi, 'onDidChangeState')
      mockGitExtensionAPi.state = APIState.UNINITIALIZED

      expect(mockGitExtensionAPi.state).to.equal(APIState.UNINITIALIZED)

      const ready = isReady(mockGitExtensionAPi)
      mockAPIStatusChanged.fire(APIState.INITIALIZED)
      const resolved = await ready

      expect(onDidChangeStateSpy).to.be.calledOnce
      expect(resolved).to.be.undefined
    })
  })
})
