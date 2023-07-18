import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, SinonStub } from 'sinon'
import { QuickPickItem, commands, window } from 'vscode'
import { Disposable } from '../../../../extension'
import { WorkspaceExperiments } from '../../../../experiments/workspace'
import { dvcDemoPath } from '../../../util'
import { RegisteredCommands } from '../../../../commands/external'
import {
  appendColumnToPath,
  buildMetricOrParamPath
} from '../../../../experiments/columns/paths'
import { buildExperiments, stubWorkspaceExperimentsGetters } from '../util'
import { Status } from '../../../../path/selection/model'
import { ColumnType } from '../../../../experiments/webview/contract'
import {
  QuickPickItemWithValue,
  QuickPickOptionsWithTitle
} from '../../../../vscode/quickPick'

suite('Experiments Columns Tree Test Suite', () => {
  const paramsFile = 'params.yaml'
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('ExperimentsColumnsTree', () => {
    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand('dvc.views.experimentsColumnsTree.focus')
      ).to.be.eventually.equal(undefined)
    })

    it('should be able to toggle whether an experiments param or metric is selected with dvc.views.experimentsColumnsTree.toggleStatus', async () => {
      const path = buildMetricOrParamPath(
        ColumnType.PARAMS,
        paramsFile,
        'learning_rate'
      )

      const { experiments } = buildExperiments({ disposer: disposable })

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

    it('should be able to toggle a parent and change the selected status of all of the children with dvc.views.experimentsColumnsTree.toggleStatus', async () => {
      const path = buildMetricOrParamPath(ColumnType.PARAMS, paramsFile)

      const { experiments } = buildExperiments({ disposer: disposable })

      await experiments.isReady()

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      const selectedChildren = experiments.getChildColumns(path) || []
      expect(selectedChildren).to.have.lengthOf.greaterThan(1)

      const selectedGrandChildren =
        experiments.getChildColumns(appendColumnToPath(path, 'process')) || []
      expect(selectedGrandChildren).to.have.lengthOf.greaterThan(1)

      const allSelectedChildren = [
        ...selectedChildren,
        ...selectedGrandChildren
      ]

      for (const column of allSelectedChildren) {
        expect(column.status).to.equal(Status.SELECTED)
      }

      const isUnselected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path
        }
      )

      expect(isUnselected).to.equal(Status.UNSELECTED)

      const unselectedChildren = experiments.getChildColumns(path) || []
      expect(selectedChildren).to.have.lengthOf.greaterThan(1)

      const unselectedGrandChildren =
        experiments.getChildColumns(appendColumnToPath(path, 'process')) || []

      const allUnselectedChildren = [
        ...unselectedChildren,
        ...unselectedGrandChildren
      ]

      for (const column of allUnselectedChildren) {
        expect(column.status).to.equal(Status.UNSELECTED)
      }
    })

    it("should be able to select a child and set all of the ancestors' statuses to indeterminate with dvc.views.experimentsColumnsTree.toggleStatus", async () => {
      const grandParentPath = buildMetricOrParamPath(
        ColumnType.PARAMS,
        paramsFile
      )
      const parentPath = appendColumnToPath(grandParentPath, 'process')

      const { experiments } = buildExperiments({ disposer: disposable })

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
        experiments.getChildColumns(grandParentPath) || []
      expect(unselectedChildren).to.have.lengthOf.greaterThan(1)

      const unselectedGrandChildren =
        experiments.getChildColumns(parentPath) || []
      expect(unselectedGrandChildren).to.have.lengthOf.greaterThan(1)

      const allUnselected = [...unselectedChildren, ...unselectedGrandChildren]

      for (const column of allUnselected) {
        expect(column?.status).to.equal(Status.UNSELECTED)
      }

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
        experiments.getChildColumns(parentPath) || []

      expect(indeterminateChildren.map(column => column.status)).to.deep.equal([
        Status.SELECTED,
        Status.UNSELECTED
      ])

      const unselectedOrIndeterminateParams =
        experiments.getChildColumns(grandParentPath) || []

      expect(
        unselectedOrIndeterminateParams.find(
          column => column.path === parentPath
        )?.status
      ).to.equal(Status.INDETERMINATE)

      for (const column of unselectedOrIndeterminateParams.filter(
        column => column.path !== parentPath
      )) {
        expect(column.status).to.equal(Status.UNSELECTED)
      }
    })

    it("should be able to unselect the last remaining selected child and set it's ancestors to unselected with dvc.views.experimentsColumnsTree.toggleStatus", async () => {
      const grandParentPath = buildMetricOrParamPath(
        ColumnType.PARAMS,
        paramsFile
      )
      const parentPath = appendColumnToPath(grandParentPath, 'process')

      const { experiments } = buildExperiments({ disposer: disposable })

      await experiments.isReady()

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      const selectedGrandChildren =
        experiments.getChildColumns(parentPath) || []
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

      for (const column of selectedGrandChildren) {
        expect(column.status).to.equal(Status.SELECTED)
      }

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: firstGrandChild.path
        }
      )

      const indeterminateGrandChildren =
        experiments.getChildColumns(parentPath) || []
      expect(selectedGrandChildren).to.have.lengthOf.greaterThan(1)

      expect(
        indeterminateGrandChildren.map(column => column.status)
      ).to.deep.equal([Status.SELECTED, Status.UNSELECTED])

      const lastSelectedIsUnselected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          path: firstGrandChild.path
        }
      )

      expect(lastSelectedIsUnselected).to.equal(Status.UNSELECTED)

      const unselectedChildren = experiments.getChildColumns(parentPath) || []

      for (const column of unselectedChildren) {
        expect(column.status).to.equal(Status.UNSELECTED)
      }

      const unselectedParents =
        experiments.getChildColumns(grandParentPath) || []

      for (const column of unselectedParents) {
        expect(column.status).to.equal(Status.UNSELECTED)
      }
    })

    it("should be able to unselect the last selected child and set it's children and ancestors to unselected with dvc.views.experimentsColumnsTree.toggleStatus", async () => {
      const grandParentPath = buildMetricOrParamPath(
        ColumnType.PARAMS,
        paramsFile
      )
      const parentPath = appendColumnToPath(grandParentPath, 'process')

      const { experiments } = buildExperiments({ disposer: disposable })

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
        .getChildColumns(grandParentPath)
        .filter(column => column.descendantStatuses.includes(Status.SELECTED))

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
        experiments.getChildColumns(parentPath) || []
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

      const unselectedChildren = experiments.getChildColumns(parentPath) || []

      for (const column of unselectedChildren) {
        expect(
          column.status,
          "each of it's children are now unselected"
        ).to.equal(Status.UNSELECTED)
      }

      const unselectedGrandParent = experiments
        .getChildColumns()
        .find(column => column.path === grandParentPath)

      expect(
        unselectedGrandParent?.status,
        'the grandparent is now unselected'
      ).to.equal(Status.UNSELECTED)
    })

    it('should be able to display selected columns first with dvc.views.experimentsColumnsTree.selectFirstColumns', async () => {
      const { experiments, columnsModel } =
        stubWorkspaceExperimentsGetters(disposable)
      await experiments.isReady()

      const columnsOrder = columnsModel.getColumnOrder()

      const firstColumns = []
      const otherColumns = []
      for (const column of columnsOrder) {
        if (column === 'id') {
          continue
        }
        if (
          [
            'params:params.yaml:learning_rate',
            'params:params.yaml:dvc_logs_dir'
          ].includes(column)
        ) {
          firstColumns.push(column)
          continue
        }
        otherColumns.push(column)
      }

      ;(
        stub(window, 'showQuickPick') as SinonStub<
          [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
          Thenable<QuickPickItemWithValue<{ path: string }>[] | undefined>
        >
      ).resolves(
        firstColumns.map(
          path =>
            ({
              label: path,
              value: { path }
            }) as QuickPickItemWithValue<{ path: string }>
        )
      )

      const orderUpdated = new Promise(resolve =>
        disposable.track(
          experiments.onDidChangeColumnOrderOrStatus(() => {
            resolve(undefined)
          })
        )
      )

      await Promise.all([
        commands.executeCommand(
          RegisteredCommands.EXPERIMENT_COLUMNS_SELECT_FIRST
        ),
        orderUpdated
      ])

      expect(columnsModel.getColumnOrder()).to.deep.equal([
        'id',
        ...firstColumns,
        ...otherColumns
      ])
    })
  })
})
