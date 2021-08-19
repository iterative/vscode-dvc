import { join } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore } from 'sinon'
import { FileSystemWatcher, window } from 'vscode'
import { Disposable } from '../../../../extension'
import { WorkspaceParamsAndMetrics } from '../../../../experiments/paramsAndMetrics/workspace'
import complexExperimentsOutput from '../../../../experiments/webview/complex-output-example.json'
import * as Watcher from '../../../../fileSystem/watcher'
import { dvcDemoPath, getFirstArgOfCall } from '../../util'
import { ParamsAndMetricsModel } from '../../../../experiments/paramsAndMetrics/model'

suite('Experiments Test Suite', () => {
  window.showInformationMessage('Start all experiments workspace params tests.')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('WorkspaceParams', () => {
    it('should call the updater function on setup', async () => {
      const mockUpdater = stub()
      const createFileSystemWatcherSpy = spy(Watcher, 'createFileSystemWatcher')

      const paramsAndMetrics = disposable.track(new ParamsAndMetricsModel())
      await paramsAndMetrics.transformAndSet(complexExperimentsOutput)

      disposable.track(
        new WorkspaceParamsAndMetrics(
          dvcDemoPath,
          paramsAndMetrics,
          mockUpdater
        )
      )

      expect(mockUpdater).not.to.be.called
      expect(createFileSystemWatcherSpy).to.be.calledOnce

      expect(getFirstArgOfCall(createFileSystemWatcherSpy, 0)).to.equal(
        join(dvcDemoPath, '**', '{dvc.lock,dvc.yaml,params.yaml,summary.json}')
      )
    })

    it('should dispose of the current watcher and instantiate a new one if the params files change', async () => {
      const mockUpdater = stub()

      const paramsAndMetrics = disposable.track(new ParamsAndMetricsModel())
      await paramsAndMetrics.transformAndSet(complexExperimentsOutput)

      const paramsAndMetricsUpdatedEvent = new Promise(resolve =>
        disposable.track(
          paramsAndMetrics.onDidChangeParamsAndMetricsFiles(() =>
            resolve(undefined)
          )
        )
      )

      const mockDispose = stub()

      const mockCreateFileSystemWatcher = stub(
        Watcher,
        'createFileSystemWatcher'
      )
      mockCreateFileSystemWatcher.callsFake(() => {
        return { dispose: mockDispose } as unknown as FileSystemWatcher
      })

      disposable.track(
        new WorkspaceParamsAndMetrics(
          dvcDemoPath,
          paramsAndMetrics,
          mockUpdater
        )
      )

      const updatedExperimentsOutput = Object.assign(
        { ...complexExperimentsOutput },
        {
          workspace: {
            baseline: {
              data: {
                metrics: {
                  ...complexExperimentsOutput.workspace.baseline.data.metrics,
                  'new_summary.json': {
                    data: { auc: 0, loss: 1 }
                  }
                },
                params: {
                  ...complexExperimentsOutput.workspace.baseline.data.params,
                  'new_params.yml': {
                    data: { new_seed: 10000, new_weight_decay: 0 }
                  }
                }
              }
            }
          }
        }
      )

      paramsAndMetrics.transformAndSet(updatedExperimentsOutput)

      await paramsAndMetricsUpdatedEvent

      expect(mockCreateFileSystemWatcher).to.be.calledTwice
      expect(mockDispose).to.be.calledOnce
      expect(getFirstArgOfCall(mockCreateFileSystemWatcher, 0)).to.equal(
        join(dvcDemoPath, '**', '{dvc.lock,dvc.yaml,params.yaml,summary.json}')
      )
      expect(getFirstArgOfCall(mockCreateFileSystemWatcher, 1)).to.equal(
        join(
          dvcDemoPath,
          '**',
          '{dvc.lock,dvc.yaml,params.yaml,new_params.yml,new_summary.json,summary.json}'
        )
      )
    })
  })
})
