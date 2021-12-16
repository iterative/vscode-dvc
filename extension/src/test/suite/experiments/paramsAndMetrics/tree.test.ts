import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { commands } from 'vscode'
import { Disposable } from '../../../../extension'
import { WorkspaceExperiments } from '../../../../experiments/workspace'
import { Status } from '../../../../experiments/metricsAndParams/model'
import { dvcDemoPath } from '../../../util'
import { RegisteredCommands } from '../../../../commands/external'
import { joinMetricOrParamPath } from '../../../../experiments/metricsAndParams/paths'
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
  describe('ExperimentsMetricsAndParamsTree', () => {
    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand(
          'dvc.views.experimentsMetricsAndParamsTree.focus'
        )
      ).to.be.eventually.equal(undefined)
    })

    it('should be able to toggle whether an experiments param or metric is selected with dvc.views.experimentsMetricsAndParamsTree.toggleStatus', async () => {
      const path = joinMetricOrParamPath('params', paramsFile, 'learning_rate')

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      const isUnselected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path
        }
      )

      expect(isUnselected).to.equal(Status.UNSELECTED)

      const isSelected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path
        }
      )

      expect(isSelected).to.equal(Status.SELECTED)

      const isUnselectedAgain = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path
        }
      )

      expect(isUnselectedAgain).to.equal(Status.UNSELECTED)
    })

    it('should be able to toggle a parent and change the selected status of all of the children with dvc.views.experimentsMetricsAndParamsTree.toggleStatus', async () => {
      const path = joinMetricOrParamPath('params', paramsFile)

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      const selectedChildren = experiments.getChildMetricsOrParams(path) || []
      expect(selectedChildren).to.have.lengthOf.greaterThan(1)

      const selectedGrandChildren =
        experiments.getChildMetricsOrParams(
          joinMetricOrParamPath(path, 'process')
        ) || []
      expect(selectedGrandChildren).to.have.lengthOf.greaterThan(1)

      const allSelectedChildren = [
        ...selectedChildren,
        ...selectedGrandChildren
      ]

      allSelectedChildren.map(metricOrParam =>
        expect(metricOrParam.status).to.equal(Status.SELECTED)
      )

      const isUnselected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path
        }
      )

      expect(isUnselected).to.equal(Status.UNSELECTED)

      const unselectedChildren = experiments.getChildMetricsOrParams(path) || []
      expect(selectedChildren).to.have.lengthOf.greaterThan(1)

      const unselectedGrandChildren =
        experiments.getChildMetricsOrParams(
          joinMetricOrParamPath(path, 'process')
        ) || []

      const allUnselectedChildren = [
        ...unselectedChildren,
        ...unselectedGrandChildren
      ]

      allUnselectedChildren.map(metricOrParam =>
        expect(metricOrParam.status).to.equal(Status.UNSELECTED)
      )
    })

    it("should be able to select a child and set all of the ancestors' statuses to indeterminate with dvc.views.experimentsMetricsAndParamsTree.toggleStatus", async () => {
      const grandParentPath = joinMetricOrParamPath('params', paramsFile)
      const parentPath = joinMetricOrParamPath(grandParentPath, 'process')

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: grandParentPath
        }
      )

      const unselectedChildren =
        experiments.getChildMetricsOrParams(grandParentPath) || []
      expect(unselectedChildren).to.have.lengthOf.greaterThan(1)

      const unselectedGrandChildren =
        experiments.getChildMetricsOrParams(parentPath) || []
      expect(unselectedGrandChildren).to.have.lengthOf.greaterThan(1)

      const allUnselected = [...unselectedChildren, ...unselectedGrandChildren]

      allUnselected.map(metricOrParam =>
        expect(metricOrParam?.status).to.equal(Status.UNSELECTED)
      )

      const [firstGrandChild] = unselectedGrandChildren

      const isSelected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: firstGrandChild.path
        }
      )

      expect(isSelected).to.equal(Status.SELECTED)

      const indeterminateChildren =
        experiments.getChildMetricsOrParams(parentPath) || []

      expect(
        indeterminateChildren.map(metricOrParam => metricOrParam.status)
      ).to.deep.equal([Status.SELECTED, Status.UNSELECTED])

      const unselectedOrIndeterminateParams =
        experiments.getChildMetricsOrParams(grandParentPath) || []

      expect(
        unselectedOrIndeterminateParams.find(
          metricOrParam => metricOrParam.path === parentPath
        )?.status
      ).to.equal(Status.INDETERMINATE)

      unselectedOrIndeterminateParams
        .filter(metricOrParam => metricOrParam.path !== parentPath)
        .map(metricOrParam =>
          expect(metricOrParam.status).to.equal(Status.UNSELECTED)
        )
    })

    it("should be able to unselect the last remaining selected child and set it's ancestors to unselected with dvc.views.experimentsMetricsAndParamsTree.toggleStatus", async () => {
      const grandParentPath = joinMetricOrParamPath('params', paramsFile)
      const parentPath = joinMetricOrParamPath(grandParentPath, 'process')

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      const selectedGrandChildren =
        experiments.getChildMetricsOrParams(parentPath) || []
      expect(selectedGrandChildren).to.have.lengthOf.greaterThan(1)

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: grandParentPath
        }
      )

      expect(selectedGrandChildren).to.have.lengthOf(2)

      const [firstGrandChild] = selectedGrandChildren

      selectedGrandChildren.map(metricOrParam =>
        expect(metricOrParam.status).to.equal(Status.SELECTED)
      )

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: firstGrandChild.path
        }
      )

      const indeterminateGrandChildren =
        experiments.getChildMetricsOrParams(parentPath) || []
      expect(selectedGrandChildren).to.have.lengthOf.greaterThan(1)

      expect(
        indeterminateGrandChildren.map(metricOrParam => metricOrParam.status)
      ).to.deep.equal([Status.SELECTED, Status.UNSELECTED])

      const lastSelectedIsUnselected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: firstGrandChild.path
        }
      )

      expect(lastSelectedIsUnselected).to.equal(Status.UNSELECTED)

      const unselectedChildren =
        experiments.getChildMetricsOrParams(parentPath) || []

      unselectedChildren.map(metricOrParam =>
        expect(metricOrParam.status).to.equal(Status.UNSELECTED)
      )

      const unselectedParents =
        experiments.getChildMetricsOrParams(grandParentPath) || []

      unselectedParents.map(metricOrParam =>
        expect(metricOrParam.status).to.equal(Status.UNSELECTED)
      )
    })

    it("should be able to unselect the last selected child and set it's children and ancestors to unselected with dvc.views.experimentsMetricsAndParamsTree.toggleStatus", async () => {
      const grandParentPath = joinMetricOrParamPath('params', paramsFile)
      const parentPath = joinMetricOrParamPath(grandParentPath, 'process')

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: grandParentPath
        }
      )

      const selected = experiments
        .getChildMetricsOrParams(grandParentPath)
        .filter(metricOrParam =>
          metricOrParam.descendantStatuses.includes(Status.SELECTED)
        )

      expect(selected, 'all of the entries are unselected').to.have.lengthOf(0)

      const selectedParent = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: parentPath
        }
      )

      expect(selectedParent, 'the parent is now selected').to.equal(
        Status.SELECTED
      )

      const selectedGrandChildren =
        experiments.getChildMetricsOrParams(parentPath) || []
      expect(
        selectedGrandChildren,
        'the grandchildren under process are now selected'
      ).to.have.lengthOf.greaterThan(1)

      const unselectedParent = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: parentPath
        }
      )

      expect(unselectedParent, 'the parent is now unselected').to.equal(
        Status.UNSELECTED
      )

      const unselectedChildren =
        experiments.getChildMetricsOrParams(parentPath) || []

      unselectedChildren.map(metricOrParam =>
        expect(
          metricOrParam.status,
          "each of it's children are now unselected"
        ).to.equal(Status.UNSELECTED)
      )

      const unselectedGrandParent = experiments
        .getChildMetricsOrParams()
        .find(metricOrParam => metricOrParam.path === grandParentPath)

      expect(
        unselectedGrandParent?.status,
        'the grandparent is now unselected'
      ).to.equal(Status.UNSELECTED)
    })
  })
})
