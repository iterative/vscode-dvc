import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { restore, stub } from 'sinon'
import { EventEmitter, Terminal, window } from 'vscode'
import { expect } from 'chai'
import { Disposable } from '../../../extension'
import { CliResult, CliStarted } from '../../../cli'
import { ProcessOptions } from '../../../process/execution'
import { ViewableCliProcess } from '../../../cli/viewable'
import { dvcDemoPath } from '../../util'
import { closeAllTerminals } from '../util'

suite('Viewable CLI Process Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('ViewableCliProcess', () => {
    it('should open a pseudoTerminal when created', async () => {
      const termName = 'I open'
      const options: ProcessOptions = {
        args: ['100'],
        cwd: dvcDemoPath,
        executable: 'sleep'
      }
      const processStarted = disposable.track(new EventEmitter<CliStarted>())
      const processCompleted = disposable.track(new EventEmitter<CliResult>())

      const onDidStartProcess = processStarted.event

      const processStartedEvent = new Promise(resolve =>
        onDidStartProcess(() => resolve(undefined))
      )

      const mockCreateTerminal = stub(window, 'createTerminal').returns({
        dispose: () => undefined
      } as Terminal)

      const viewableCliProcess = disposable.track(
        new ViewableCliProcess(
          termName,
          options,
          processStarted,
          processCompleted
        )
      )

      await processStartedEvent
      expect(mockCreateTerminal).to.be.called

      viewableCliProcess.dispose()
    }).timeout(8000)

    it('should call dispose when the pseudoTerminal is closed', async () => {
      const termName = 'Close Me'
      const options: ProcessOptions = {
        args: ['10000000'],
        cwd: dvcDemoPath,
        executable: 'sleep'
      }
      const processStarted = disposable.track(new EventEmitter<CliStarted>())
      const processCompleted = disposable.track(new EventEmitter<CliResult>())

      const viewableCliProcess = disposable.track(
        new ViewableCliProcess(
          termName,
          options,
          processStarted,
          processCompleted
        )
      )

      const disposedEvent = new Promise(resolve =>
        disposable.track(
          viewableCliProcess.onDidDispose(() => {
            resolve(undefined)
          })
        )
      )

      await viewableCliProcess.isReady()

      await closeAllTerminals()

      await disposedEvent
    }).timeout(8000)
  })
})
