import { join } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { window, commands, Uri } from 'vscode'
import { Disposable } from '../../../../extension'
import complexExperimentsOutput from '../../../../experiments/webview/complex-output-example.json'
import { Experiments } from '../../../../experiments'
import { ExperimentsRepository } from '../../../../experiments/repository'
import { Status } from '../../../../experiments/paramsAndMetrics/model'
import { ResourceLocator } from '../../../../resourceLocator'
import { Config } from '../../../../config'
import { CliReader } from '../../../../cli/reader'
import { InternalCommands } from '../../../../internalCommands'
import { dvcDemoPath, resourcePath } from '../../util'

suite('Experiments Params And Metrics Tree Test Suite', () => {
  window.showInformationMessage(
    'Start all experiments params and metrics tree tests.'
  )

  const toggleCommand = 'dvc.views.experimentsParamsAndMetricsTree.toggleStatus'
  const paramsFile = 'params.yaml'
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('ExperimentsParamsAndMetricsTree', () => {
    it('should be able to toggle whether an experiments param or metric is selected with dvc.views.experimentsParamsAndMetricsTree.toggleStatus', async () => {
      const path = join('params', paramsFile, 'learning_rate')

      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const experimentsRepository = disposable.track(
        new ExperimentsRepository(
          dvcDemoPath,
          internalCommands,
          resourceLocator
        )
      )

      await experimentsRepository.isReady()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getRepository').returns(
        experimentsRepository
      )

      const isUnselected = await commands.executeCommand(toggleCommand, {
        dvcRoot: dvcDemoPath,
        path
      })

      expect(isUnselected).to.equal(Status.unselected)

      const isSelected = await commands.executeCommand(toggleCommand, {
        dvcRoot: dvcDemoPath,
        path
      })

      expect(isSelected).to.equal(Status.selected)

      const isUnselectedAgain = await commands.executeCommand(toggleCommand, {
        dvcRoot: dvcDemoPath,
        path
      })

      expect(isUnselectedAgain).to.equal(Status.unselected)
    })

    it('should be able to toggle a parent and change the selected status of all of the children with dvc.views.experimentsParamsAndMetricsTree.toggleStatus', async () => {
      const path = join('params', paramsFile)

      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const experimentsRepository = disposable.track(
        new ExperimentsRepository(
          dvcDemoPath,
          internalCommands,
          resourceLocator
        )
      )

      await experimentsRepository.isReady()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getRepository').returns(
        experimentsRepository
      )

      const selectedChildren =
        experimentsRepository.getChildParamsOrMetrics(path) || []
      expect(selectedChildren).to.have.lengthOf.greaterThan(1)

      const selectedGrandChildren =
        experimentsRepository.getChildParamsOrMetrics(join(path, 'process')) ||
        []
      expect(selectedGrandChildren).to.have.lengthOf.greaterThan(1)

      const allSelectedChildren = [
        ...selectedChildren,
        ...selectedGrandChildren
      ]

      allSelectedChildren.map(paramOrMetric =>
        expect(paramOrMetric.status).to.equal(Status.selected)
      )

      const isUnselected = await commands.executeCommand(toggleCommand, {
        dvcRoot: dvcDemoPath,
        path
      })

      expect(isUnselected).to.equal(Status.unselected)

      const unselectedChildren =
        experimentsRepository.getChildParamsOrMetrics(path) || []
      expect(selectedChildren).to.have.lengthOf.greaterThan(1)

      const unselectedGrandChildren =
        experimentsRepository.getChildParamsOrMetrics(join(path, 'process')) ||
        []

      const allUnselectedChildren = [
        ...unselectedChildren,
        ...unselectedGrandChildren
      ]

      allUnselectedChildren.map(paramOrMetric =>
        expect(paramOrMetric.status).to.equal(Status.unselected)
      )
    })

    it("should be able to select a child and set all of the ancestors' statuses to indeterminate with dvc.views.experimentsParamsAndMetricsTree.toggleStatus", async () => {
      const grandParentPath = join('params', paramsFile)
      const parentPath = join(grandParentPath, 'process')

      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const experimentsRepository = disposable.track(
        new ExperimentsRepository(
          dvcDemoPath,
          internalCommands,
          resourceLocator
        )
      )

      await experimentsRepository.isReady()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getRepository').returns(
        experimentsRepository
      )

      await commands.executeCommand(toggleCommand, {
        dvcRoot: dvcDemoPath,
        path: grandParentPath
      })

      const unselectedChildren =
        experimentsRepository.getChildParamsOrMetrics(grandParentPath) || []
      expect(unselectedChildren).to.have.lengthOf.greaterThan(1)

      const unselectedGrandChildren =
        experimentsRepository.getChildParamsOrMetrics(parentPath) || []
      expect(unselectedGrandChildren).to.have.lengthOf.greaterThan(1)

      const allUnselected = [...unselectedChildren, ...unselectedGrandChildren]

      allUnselected.map(paramOrMetric =>
        expect(paramOrMetric?.status).to.equal(Status.unselected)
      )

      const [firstGrandChild] = unselectedGrandChildren

      const isSelected = await commands.executeCommand(toggleCommand, {
        dvcRoot: dvcDemoPath,
        path: firstGrandChild.path
      })

      expect(isSelected).to.equal(Status.selected)

      const indeterminateChildren =
        experimentsRepository.getChildParamsOrMetrics(parentPath) || []

      expect(
        indeterminateChildren.map(paramOrMetric => paramOrMetric.status)
      ).to.deep.equal([Status.selected, Status.unselected])

      const unselectedOrIndeterminateParams =
        experimentsRepository.getChildParamsOrMetrics(grandParentPath) || []

      expect(
        unselectedOrIndeterminateParams.find(
          paramOrMetric => paramOrMetric.path === parentPath
        )?.status
      ).to.equal(Status.indeterminate)

      unselectedOrIndeterminateParams
        .filter(paramOrMetric => paramOrMetric.path !== parentPath)
        .map(paramOrMetric =>
          expect(paramOrMetric.status).to.equal(Status.unselected)
        )
    })

    it("should be able to unselect the last remaining selected child and set it's ancestors to unselected with dvc.views.experimentsParamsAndMetricsTree.toggleStatus", async () => {
      const grandParentPath = join('params', paramsFile)
      const parentPath = join(grandParentPath, 'process')

      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const experimentsRepository = disposable.track(
        new ExperimentsRepository(
          dvcDemoPath,
          internalCommands,
          resourceLocator
        )
      )

      await experimentsRepository.isReady()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getRepository').returns(
        experimentsRepository
      )

      const selectedGrandChildren =
        experimentsRepository.getChildParamsOrMetrics(parentPath) || []
      expect(selectedGrandChildren).to.have.lengthOf.greaterThan(1)

      await commands.executeCommand(toggleCommand, {
        dvcRoot: dvcDemoPath,
        path: grandParentPath
      })

      expect(selectedGrandChildren).to.have.lengthOf(2)

      const [firstGrandChild] = selectedGrandChildren

      selectedGrandChildren.map(paramOrMetric =>
        expect(paramOrMetric.status).to.equal(Status.selected)
      )

      await commands.executeCommand(toggleCommand, {
        dvcRoot: dvcDemoPath,
        path: firstGrandChild.path
      })

      const indeterminateGrandChildren =
        experimentsRepository.getChildParamsOrMetrics(parentPath) || []
      expect(selectedGrandChildren).to.have.lengthOf.greaterThan(1)

      expect(
        indeterminateGrandChildren.map(paramOrMetric => paramOrMetric.status)
      ).to.deep.equal([Status.selected, Status.unselected])

      const lastSelectedIsUnselected = await commands.executeCommand(
        toggleCommand,
        {
          dvcRoot: dvcDemoPath,
          path: firstGrandChild.path
        }
      )

      expect(lastSelectedIsUnselected).to.equal(Status.unselected)

      const unselectedChildren =
        experimentsRepository.getChildParamsOrMetrics(parentPath) || []

      unselectedChildren.map(paramOrMetric =>
        expect(paramOrMetric.status).to.equal(Status.unselected)
      )

      const unselectedParents =
        experimentsRepository.getChildParamsOrMetrics(grandParentPath) || []

      unselectedParents.map(paramOrMetric =>
        expect(paramOrMetric.status).to.equal(Status.unselected)
      )
    })
  })
})
