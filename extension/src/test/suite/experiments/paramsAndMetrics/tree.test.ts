import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { commands } from 'vscode'
import { Disposable } from '../../../../extension'
import { WorkspaceExperiments } from '../../../../experiments/workspace'
import { Status } from '../../../../experiments/paramsAndMetrics/model'
import { dvcDemoPath } from '../../util'
import { RegisteredCommands } from '../../../../commands/external'
import { joinParamOrMetricPath } from '../../../../experiments/paramsAndMetrics/paths'
import { buildExperiments } from '../util'

suite('Experiments Params And Metrics Tree Test Suite', () => {
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
    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand(
          'dvc.views.experimentsParamsAndMetricsTree.focus'
        )
      ).to.be.eventually.equal(undefined)
    })

    it('should be able to toggle whether an experiments param or metric is selected with dvc.views.experimentsParamsAndMetricsTree.toggleStatus', async () => {
      const path = joinParamOrMetricPath('params', paramsFile, 'learning_rate')

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      const isUnselected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path
        }
      )

      expect(isUnselected).to.equal(Status.UNSELECTED)

      const isSelected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path
        }
      )

      expect(isSelected).to.equal(Status.SELECTED)

      const isUnselectedAgain = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path
        }
      )

      expect(isUnselectedAgain).to.equal(Status.UNSELECTED)
    })

    it('should be able to toggle a parent and change the selected status of all of the children with dvc.views.experimentsParamsAndMetricsTree.toggleStatus', async () => {
      const path = joinParamOrMetricPath('params', paramsFile)

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      const selectedChildren = experiments.getChildParamsOrMetrics(path) || []
      expect(selectedChildren).to.have.lengthOf.greaterThan(1)

      const selectedGrandChildren =
        experiments.getChildParamsOrMetrics(
          joinParamOrMetricPath(path, 'process')
        ) || []
      expect(selectedGrandChildren).to.have.lengthOf.greaterThan(1)

      const allSelectedChildren = [
        ...selectedChildren,
        ...selectedGrandChildren
      ]

      allSelectedChildren.map(paramOrMetric =>
        expect(paramOrMetric.status).to.equal(Status.SELECTED)
      )

      const isUnselected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path
        }
      )

      expect(isUnselected).to.equal(Status.UNSELECTED)

      const unselectedChildren = experiments.getChildParamsOrMetrics(path) || []
      expect(selectedChildren).to.have.lengthOf.greaterThan(1)

      const unselectedGrandChildren =
        experiments.getChildParamsOrMetrics(
          joinParamOrMetricPath(path, 'process')
        ) || []

      const allUnselectedChildren = [
        ...unselectedChildren,
        ...unselectedGrandChildren
      ]

      allUnselectedChildren.map(paramOrMetric =>
        expect(paramOrMetric.status).to.equal(Status.UNSELECTED)
      )
    })

    it("should be able to select a child and set all of the ancestors' statuses to indeterminate with dvc.views.experimentsParamsAndMetricsTree.toggleStatus", async () => {
      const grandParentPath = joinParamOrMetricPath('params', paramsFile)
      const parentPath = joinParamOrMetricPath(grandParentPath, 'process')

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: grandParentPath
        }
      )

      const unselectedChildren =
        experiments.getChildParamsOrMetrics(grandParentPath) || []
      expect(unselectedChildren).to.have.lengthOf.greaterThan(1)

      const unselectedGrandChildren =
        experiments.getChildParamsOrMetrics(parentPath) || []
      expect(unselectedGrandChildren).to.have.lengthOf.greaterThan(1)

      const allUnselected = [...unselectedChildren, ...unselectedGrandChildren]

      allUnselected.map(paramOrMetric =>
        expect(paramOrMetric?.status).to.equal(Status.UNSELECTED)
      )

      const [firstGrandChild] = unselectedGrandChildren

      const isSelected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: firstGrandChild.path
        }
      )

      expect(isSelected).to.equal(Status.SELECTED)

      const indeterminateChildren =
        experiments.getChildParamsOrMetrics(parentPath) || []

      expect(
        indeterminateChildren.map(paramOrMetric => paramOrMetric.status)
      ).to.deep.equal([Status.SELECTED, Status.UNSELECTED])

      const unselectedOrIndeterminateParams =
        experiments.getChildParamsOrMetrics(grandParentPath) || []

      expect(
        unselectedOrIndeterminateParams.find(
          paramOrMetric => paramOrMetric.path === parentPath
        )?.status
      ).to.equal(Status.INDETERMINATE)

      unselectedOrIndeterminateParams
        .filter(paramOrMetric => paramOrMetric.path !== parentPath)
        .map(paramOrMetric =>
          expect(paramOrMetric.status).to.equal(Status.UNSELECTED)
        )
    })

    it("should be able to unselect the last remaining selected child and set it's ancestors to unselected with dvc.views.experimentsParamsAndMetricsTree.toggleStatus", async () => {
      const grandParentPath = joinParamOrMetricPath('params', paramsFile)
      const parentPath = joinParamOrMetricPath(grandParentPath, 'process')

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      const selectedGrandChildren =
        experiments.getChildParamsOrMetrics(parentPath) || []
      expect(selectedGrandChildren).to.have.lengthOf.greaterThan(1)

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: grandParentPath
        }
      )

      expect(selectedGrandChildren).to.have.lengthOf(2)

      const [firstGrandChild] = selectedGrandChildren

      selectedGrandChildren.map(paramOrMetric =>
        expect(paramOrMetric.status).to.equal(Status.SELECTED)
      )

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: firstGrandChild.path
        }
      )

      const indeterminateGrandChildren =
        experiments.getChildParamsOrMetrics(parentPath) || []
      expect(selectedGrandChildren).to.have.lengthOf.greaterThan(1)

      expect(
        indeterminateGrandChildren.map(paramOrMetric => paramOrMetric.status)
      ).to.deep.equal([Status.SELECTED, Status.UNSELECTED])

      const lastSelectedIsUnselected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: firstGrandChild.path
        }
      )

      expect(lastSelectedIsUnselected).to.equal(Status.UNSELECTED)

      const unselectedChildren =
        experiments.getChildParamsOrMetrics(parentPath) || []

      unselectedChildren.map(paramOrMetric =>
        expect(paramOrMetric.status).to.equal(Status.UNSELECTED)
      )

      const unselectedParents =
        experiments.getChildParamsOrMetrics(grandParentPath) || []

      unselectedParents.map(paramOrMetric =>
        expect(paramOrMetric.status).to.equal(Status.UNSELECTED)
      )
    })

    it("should be able to unselect the last selected child and set it's children and ancestors to unselected with dvc.views.experimentsParamsAndMetricsTree.toggleStatus", async () => {
      const grandParentPath = joinParamOrMetricPath('params', paramsFile)
      const parentPath = joinParamOrMetricPath(grandParentPath, 'process')

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: grandParentPath
        }
      )

      const selected = experiments
        .getChildParamsOrMetrics(grandParentPath)
        .filter(paramOrMetric =>
          paramOrMetric.descendantStatuses.includes(Status.SELECTED)
        )

      expect(selected, 'all of the entries are unselected').to.have.lengthOf(0)

      const selectedParent = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: parentPath
        }
      )

      expect(selectedParent, 'the parent is now selected').to.equal(
        Status.SELECTED
      )

      const selectedGrandChildren =
        experiments.getChildParamsOrMetrics(parentPath) || []
      expect(
        selectedGrandChildren,
        'the grandchildren under process are now selected'
      ).to.have.lengthOf.greaterThan(1)

      const unselectedParent = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: parentPath
        }
      )

      expect(unselectedParent, 'the parent is now unselected').to.equal(
        Status.UNSELECTED
      )

      const unselectedChildren =
        experiments.getChildParamsOrMetrics(parentPath) || []

      unselectedChildren.map(paramOrMetric =>
        expect(
          paramOrMetric.status,
          "each of it's children are now unselected"
        ).to.equal(Status.UNSELECTED)
      )

      const unselectedGrandParent = experiments
        .getChildParamsOrMetrics()
        .find(paramOrMetric => paramOrMetric.path === grandParentPath)

      expect(
        unselectedGrandParent?.status,
        'the grandparent is now unselected'
      ).to.equal(Status.UNSELECTED)
    })
  })
})
