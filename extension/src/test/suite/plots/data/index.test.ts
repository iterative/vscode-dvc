import { join } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, stub } from 'sinon'
import { Disposable } from '../../../../extension'
import { PlotsData } from '../../../../plots/data'
import { PlotsModel } from '../../../../plots/model'
import { dvcDemoPath } from '../../../util'
import { buildDependencies, getFirstArgOfLastCall } from '../../util'
import { getRelativePattern } from '../../../../fileSystem/watcher'
import multiSourcePlotsDiffFixture from '../../../fixtures/plotsDiff/output/multiSource'

suite('Plots Data Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(function () {
    this.timeout(6000)
    disposable.dispose()
  })

  const buildPlotsData = (
    experimentIsRunning: boolean,
    missingRevisions: string[] = [],
    mutableRevisions: string[] = []
  ) => {
    const {
      internalCommands,
      updatesPaused,
      mockPlotsDiff,
      dvcRunner,
      mockCreateFileSystemWatcher
    } = buildDependencies(disposable)

    stub(dvcRunner, 'isExperimentRunning').returns(experimentIsRunning)

    const mockGetMissingRevisions = stub().returns(missingRevisions)
    const mockGetMutableRevisions = stub().returns(mutableRevisions)

    const mockPlotsModel = {
      getMissingRevisions: mockGetMissingRevisions,
      getMutableRevisions: mockGetMutableRevisions
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
      mockCreateFileSystemWatcher,
      mockPlotsDiff
    }
  }

  describe('PlotsData', () => {
    it('should not call plots diff when there are no revisions to fetch and an experiment running (checkpoints)', async () => {
      const { data, mockPlotsDiff } = buildPlotsData(true)

      await data.update()

      expect(mockPlotsDiff).not.to.be.called
    })

    it('should call plots diff when there are no revisions to fetch and no experiment is running (workspace updates)', async () => {
      const { data, mockPlotsDiff } = buildPlotsData(false, [], [])

      await data.update()

      expect(mockPlotsDiff).to.be.calledOnce
      expect(mockPlotsDiff).to.be.calledWithExactly(dvcDemoPath)
    })

    it('should call plots diff when an experiment is running in the workspace (live updates)', async () => {
      const { data, mockPlotsDiff } = buildPlotsData(true, [], ['workspace'])

      await data.update()

      expect(mockPlotsDiff).to.be.calledWithExactly(dvcDemoPath)
    })

    it('should call plots diff when an experiment is running in a temporary directory (live updates)', async () => {
      const { data, mockPlotsDiff } = buildPlotsData(true, [], ['a7739b5'])

      await data.update()

      expect(mockPlotsDiff).to.be.calledOnce
      expect(mockPlotsDiff).to.be.calledWithExactly(dvcDemoPath, 'a7739b5')
    })

    it('should call plots diff when an experiment is running and there are missing revisions (checkpoints)', async () => {
      const { data, mockPlotsDiff } = buildPlotsData(
        true,
        ['53c3851', '4fb124a', '42b8736', '1ba7bcd'],
        []
      )

      await data.update()

      expect(mockPlotsDiff).to.be.calledOnce
      expect(mockPlotsDiff).to.be.calledWithExactly(
        dvcDemoPath,
        '1ba7bcd',
        '42b8736',
        '4fb124a',
        '53c3851'
      )
    })

    it('should call plots diff when an experiment is running and there are missing revisions and one of them is mutable', async () => {
      const { data, mockPlotsDiff } = buildPlotsData(
        true,
        ['53c3851', '4fb124a', '42b8736', '1ba7bcd'],
        ['1ba7bcd']
      )

      await data.update()

      expect(mockPlotsDiff).to.be.calledOnce
      expect(mockPlotsDiff).to.be.calledWithExactly(
        dvcDemoPath,
        '1ba7bcd',
        '42b8736',
        '4fb124a',
        '53c3851'
      )
    })

    it('should handle watching paths for top level plots', async () => {
      const { data, mockPlotsDiff, mockCreateFileSystemWatcher } =
        buildPlotsData(false)

      const dataUpdatedEvent = new Promise(resolve =>
        disposable.track(data.onDidUpdate(() => resolve(undefined)))
      )

      mockPlotsDiff.resolves(multiSourcePlotsDiffFixture)

      data.update()

      await dataUpdatedEvent

      expect(getFirstArgOfLastCall(mockCreateFileSystemWatcher)).to.deep.equal(
        getRelativePattern(
          dvcDemoPath,
          join(
            '**',
            '{' +
              'dvc.yaml,' +
              'dvc.lock,' +
              [
                join('evaluation', 'test', 'plots', 'confusion_matrix.json'),
                join('evaluation', 'test', 'plots', 'precision_recall.json'),
                join('evaluation', 'test', 'plots', 'roc.json'),
                join('evaluation', 'train', 'plots', 'confusion_matrix.json'),
                join('evaluation', 'train', 'plots', 'precision_recall.json'),
                join('evaluation', 'train', 'plots', 'roc.json')
              ].join(',') +
              '}'
          )
        )
      )
    })
  })
})
