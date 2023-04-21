import { join } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { EventEmitter } from 'vscode'
import { expect } from 'chai'
import { restore, spy, stub } from 'sinon'
import { PlotsData } from '../../../../plots/data'
import { PlotsModel } from '../../../../plots/model'
import { dvcDemoPath } from '../../../util'
import {
  buildDependencies,
  bypassProcessManagerDebounce,
  getMockNow,
  getTimeSafeDisposer
} from '../../util'
import {
  AvailableCommands,
  CommandId,
  InternalCommands
} from '../../../../commands/internal'
import { fireWatcher } from '../../../../fileSystem/watcher'
import { getProcessPlatform } from '../../../../env'
import { removeDir } from '../../../../fileSystem'
import { EXPERIMENT_WORKSPACE_ID } from '../../../../cli/dvc/contract'

suite('Plots Data Test Suite', () => {
  const disposable = getTimeSafeDisposer()

  beforeEach(() => {
    restore()
  })

  afterEach(function () {
    this.timeout(6000)
    return disposable.disposeAndFlush()
  })

  const buildPlotsData = (selectedRevisions: string[] = []) => {
    const { internalCommands, updatesPaused, mockPlotsDiff } =
      buildDependencies(disposable)

    const mockGetSelectedOrderedIds = stub().returns(selectedRevisions)

    const mockPlotsModel = {
      getSelectedOrderedIds: mockGetSelectedOrderedIds
    } as unknown as PlotsModel

    const data = disposable.track(
      new PlotsData(
        dvcDemoPath,
        internalCommands,
        mockPlotsModel,
        updatesPaused
      )
    )

    return {
      data,
      mockPlotsDiff
    }
  }

  describe('PlotsData', () => {
    it('should call plots diff when there are no revisions to fetch and no experiment is running (workspace updates)', async () => {
      const { data, mockPlotsDiff } = buildPlotsData([])

      await data.update()

      expect(mockPlotsDiff).to.be.calledOnce
      expect(mockPlotsDiff).to.be.calledWithExactly(dvcDemoPath)
    })

    it('should watch metrics files for updates', async () => {
      const mockNow = getMockNow()
      const parentDirectory = 'training'
      const metricsFile = join(parentDirectory, 'metrics.json')
      const collectedFile = join(
        'training',
        'plots',
        'metrics',
        'train',
        'acc.tsv'
      )

      const mockExecuteCommand = (command: CommandId) => {
        if (command === AvailableCommands.PLOTS_DIFF) {
          return Promise.resolve({
            data: {
              'dvc.yaml::Accuracy': [
                {
                  datapoints: {
                    workspace: [
                      {
                        dvc_data_version_info: {
                          field: join('train', 'acc'),
                          filename: collectedFile,
                          revision: EXPERIMENT_WORKSPACE_ID
                        },
                        dvc_inferred_y_value: '0.2707333333333333',
                        step: '0',
                        [join('train', 'acc')]: '0.2707333333333333'
                      }
                    ]
                  },
                  revisions: [EXPERIMENT_WORKSPACE_ID],
                  type: 'vega'
                }
              ]
            }
          })
        }
      }

      const data = disposable.track(
        new PlotsData(
          dvcDemoPath,
          {
            dispose: stub(),
            executeCommand: mockExecuteCommand
          } as unknown as InternalCommands,
          {
            getSelectedOrderedIds: () => []
          } as unknown as PlotsModel,
          disposable.track(new EventEmitter<boolean>())
        )
      )

      void data.update()
      await data.isReady()
      data.setMetricFiles([metricsFile])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((data as any).collectedFiles).to.deep.equal([
        collectedFile,
        metricsFile
      ])

      bypassProcessManagerDebounce(mockNow)

      const managedUpdateSpy = spy(data, 'managedUpdate')
      const dataUpdatedEvent = new Promise(resolve =>
        disposable.track(data.onDidUpdate(() => resolve(undefined)))
      )

      await fireWatcher(join(dvcDemoPath, metricsFile))
      await dataUpdatedEvent

      expect(
        managedUpdateSpy,
        'should update data when an event is fired for a watched file'
      ).to.be.called
      managedUpdateSpy.resetHistory()

      bypassProcessManagerDebounce(mockNow, 2)

      const secondDataUpdatedEvent = new Promise(resolve =>
        disposable.track(data.onDidUpdate(() => resolve(undefined)))
      )

      const absParentDirectory = join(dvcDemoPath, parentDirectory)

      if (getProcessPlatform() === 'win32') {
        removeDir(absParentDirectory)
      } else {
        await fireWatcher(absParentDirectory)
      }

      await secondDataUpdatedEvent

      expect(
        managedUpdateSpy,
        'should update data when an event is fired for a parent directory'
      ).to.be.called
    })
  })
})
