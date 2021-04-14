import { describe, it } from 'mocha'
import sinonChai from 'sinon-chai'
import chai from 'chai'
import {
  tasks,
  EventEmitter,
  ShellExecution,
  Task,
  TaskExecution,
  TaskScope,
  window,
  TaskProcessStartEvent
} from 'vscode'

chai.use(sinonChai)
const { expect } = chai

suite('Task Test Suite', () => {
  window.showInformationMessage('Start all task tests.')

  describe('Task', () => {
    it('Execution from onDidEndTaskProcess and onDidStartTaskProcess are equal to original', async () => {
      const disposables = []
      return new Promise<void>(resolve => {
        const task = new Task(
          { type: 'testTask' },
          TaskScope.Workspace,
          'echo',
          'testTask',
          new ShellExecution(
            'PATH=/Users/mattseddon/PP/vscode-dvc/demo/.env/bin:$PATH dvc exp run'
          )
        )
        // eslint-disable-next-line prefer-const
        let taskExecution: TaskExecution
        const executeDoneEvent: EventEmitter<void> = new EventEmitter()
        const taskExecutionShouldBeSet: Promise<void> = new Promise(resolve => {
          const disposable = executeDoneEvent.event(() => {
            resolve()
            disposable.dispose()
          })
        })
        let count = 2
        const progressMade: EventEmitter<void> = new EventEmitter()
        let startSucceeded = false
        let endSucceeded = false
        disposables.push(
          progressMade.event(() => {
            count--
            if (count === 0 && startSucceeded && endSucceeded) {
              resolve()
            }
          })
        )

        disposables.push(
          tasks.onDidStartTaskProcess(async (e: TaskProcessStartEvent) => {
            await taskExecutionShouldBeSet
            if (e.execution === taskExecution) {
              startSucceeded = true
              progressMade.fire()
            }
          })
        )

        disposables.push(
          tasks.onDidEndTaskProcess(async e => {
            await taskExecutionShouldBeSet
            if (e.execution === taskExecution) {
              endSucceeded = true
              progressMade.fire()
            }
          })
        )
        tasks.executeTask(task).then(() => {
          executeDoneEvent.fire()
          expect(true).to.be.true
        })
      })
    }).timeout(60000000)
  })
})
