import { describe, it, afterEach } from 'mocha'
import chai from 'chai'
import { stub, restore } from 'sinon'
import sinonChai from 'sinon-chai'
import { window } from 'vscode'
import * as Execution from '../../../cli/execution'
import ChildProcessModule, { ChildProcess } from 'child_process'
import { Commands } from '../../../cli/commands'
import { EventEmitter } from 'events'

chai.use(sinonChai)
const { expect } = chai

suite('Execution Test Suite', () => {
  window.showInformationMessage('Start all execution tests.')

  const { spawnProcess } = Execution

  describe('spawnProcess', () => {
    it('should be able to execute a command', async (): Promise<void> => {
      const childProcess = new EventEmitter() as ChildProcess
      const stubbedSpawn = stub(ChildProcessModule, 'spawn').returns(
        childProcess
      )

      const text = ':weeeee:'
      const command = 'echo ' + text

      const cwd = __dirname

      const stubbedGetExecutionDetails = stub(
        Execution,
        'getExecutionDetails'
      ).returns({ command, cwd, env: {} })

      const promise = spawnProcess(
        {
          cliPath: undefined,
          cwd,
          pythonBinPath: undefined
        },
        Commands.STATUS
      )

      childProcess.emit('close')

      await promise

      expect(stubbedSpawn).to.be.called

      expect(stubbedGetExecutionDetails).to.be.calledWith({
        cliPath: undefined,
        command: 'status --show-json',
        cwd,
        pythonBinPath: undefined
      })
    })
  })
})

afterEach(() => {
  restore()
})
