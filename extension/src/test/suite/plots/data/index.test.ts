import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, stub } from 'sinon'
import { Disposable } from '../../../../extension'
import { PlotsData } from '../../../../plots/data'
import { PlotsModel } from '../../../../plots/model'
import { dvcDemoPath } from '../../../util'
import { buildDependencies } from '../../util'

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
    mutableRevisions: string[] = [],
    defaultRevs: string[] = []
  ) => {
    const { internalCommands, updatesPaused, mockPlotsDiff, cliRunner } =
      buildDependencies(disposable)

    stub(cliRunner, 'isExperimentRunning').returns(experimentIsRunning)

    const data = disposable.track(
      new PlotsData(dvcDemoPath, internalCommands, updatesPaused)
    )

    const mockGetMissingRevisions = stub().returns(missingRevisions)
    const mockGetMutableRevisions = stub().returns(mutableRevisions)
    const mockGetDefaultRevs = stub().returns(defaultRevs)

    const mockPlotsModel = {
      getDefaultRevs: mockGetDefaultRevs,
      getMissingRevisions: mockGetMissingRevisions,
      getMutableRevisions: mockGetMutableRevisions
    } as unknown as PlotsModel

    data.setModel(mockPlotsModel)

    return {
      data,
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
      const defaultRevisions = ['workspace', '4d78b9e']
      const { data, mockPlotsDiff } = buildPlotsData(
        false,
        [],
        [],
        defaultRevisions
      )

      await data.update()

      expect(mockPlotsDiff).to.be.calledOnce
      expect(mockPlotsDiff).to.be.calledWithExactly(
        dvcDemoPath,
        ...defaultRevisions
      )
    })

    it('should call plots diff when an experiment is running in the workspace (live updates)', async () => {
      const defaultRevisions = ['workspace', '4d78b9e']
      const { data, mockPlotsDiff } = buildPlotsData(
        true,
        [],
        ['workspace'],
        defaultRevisions
      )

      await data.update()

      expect(mockPlotsDiff).to.be.calledWithExactly(
        dvcDemoPath,
        ...defaultRevisions
      )
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
  })
})
