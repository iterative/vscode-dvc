import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore } from 'sinon'
import { EventEmitter } from 'vscode'
import kill from 'tree-kill'
import { Disposable } from '@hediet/std/disposable'
import { getOptions } from './util'
import { createProcess, processExists } from '../../../processExecution'
import { createValidInteger } from '../../../util/number'
import { Cli, CliEvent, CliResult } from '../../../cli'
import { delay } from '../../../util/time'

suite('CLI Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('Cli', () => {
    it('should be able to create a background process that does not exit when the parent process exits', async () => {
      const options = getOptions('child')
      const child = createProcess(options)

      const stdout = await new Promise<string>(resolve =>
        child.all?.on('data', chunk => resolve(chunk.toString().trim()))
      )

      const childPid = createValidInteger(child.pid) as number
      const backgroundPid = createValidInteger(stdout) as number
      expect(childPid).to.be.a('number')
      expect(backgroundPid).to.be.a('number')

      const childExists = await processExists(childPid)
      const backgroundExists = await processExists(childPid)

      expect(childExists).to.be.true
      expect(backgroundExists).to.be.true

      child.kill()
      expect(child.killed).to.be.true

      const childRunning = await processExists(childPid)
      const backgroundRunning = await processExists(backgroundPid)

      expect(childRunning).to.be.false
      expect(backgroundRunning).to.be.true

      const killed = await new Promise(resolve =>
        kill(backgroundPid as number, async error => {
          expect(error).to.be.undefined
          const backgroundRunning = await processExists(backgroundPid)
          expect(backgroundRunning).to.be.false
          resolve(true)
        })
      )
      expect(killed).to.be.true
    })

    it('should cleanup all non-background processes on dispose', async () => {
      const processStarted = disposable.track(new EventEmitter<CliEvent>())
      const processCompleted = disposable.track(new EventEmitter<CliResult>())

      const cli = new Cli({ processCompleted, processStarted })

      const processCreatedEvent = new Promise<CliEvent>(resolve =>
        disposable.track(processStarted.event(event => resolve(event)))
      )
      const options = getOptions('background')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(cli as any).executeProcess(options)

      const { pid } = await processCreatedEvent
      const executingPid = createValidInteger(pid) as number

      expect(executingPid).to.be.a('number')

      const pidIsExecuting = await processExists(executingPid)

      expect(pidIsExecuting).to.be.true

      cli.dispose()
      await delay(500)

      const processIsStillExecuting = await processExists(executingPid)

      expect(processIsStillExecuting).to.be.false
    })
  })
})
