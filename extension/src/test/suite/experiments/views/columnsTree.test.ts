import { join, relative, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { window, commands, Uri } from 'vscode'
import { Disposable } from '../../../../extension'
import complexExperimentsOutput from '../../../../experiments/webview/complex-output-example.json'
import { ExperimentsColumnsTree } from '../../../../experiments/views/columnsTree'
import { Experiments } from '../../../../experiments'
import { ColumnStatus, ExperimentsTable } from '../../../../experiments/table'
import { ResourceLocator } from '../../../../resourceLocator'
import { Config } from '../../../../config'
import { CliReader } from '../../../../cli/reader'
import { InternalCommands } from '../../../../internalCommands'

suite('Extension Test Suite', () => {
  window.showInformationMessage('Start all experiment columns tree tests.')

  const dvcDemoPath = resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    '..',
    'demo'
  )
  const resourcePath = resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    '..',
    'resources'
  )
  const toggleCommand = 'dvc.views.experimentColumnsTree.toggleSelected'
  const paramsFile = 'params.yaml'
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('ExperimentColumnsTree', () => {
    it('should be able to toggle whether an experiments column is selected with dvc.views.experimentColumnsTree.toggleSelected', async () => {
      const relPath = join('params', paramsFile, 'learning_rate')
      const absPath = join(dvcDemoPath, relPath)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((ExperimentsColumnsTree as any).prototype, 'getDetails').returns([
        dvcDemoPath,
        relPath
      ])

      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const experimentsTable = disposable.track(
        new ExperimentsTable(dvcDemoPath, internalCommands, resourceLocator)
      )

      await experimentsTable.isReady()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getTable').returns(experimentsTable)

      const isUnselected = await commands.executeCommand(toggleCommand, absPath)

      expect(isUnselected).to.equal(ColumnStatus.unselected)

      const isSelected = await commands.executeCommand(toggleCommand, absPath)

      expect(isSelected).to.equal(ColumnStatus.selected)

      const isUnselectedAgain = await commands.executeCommand(
        toggleCommand,
        absPath
      )

      expect(isUnselectedAgain).to.equal(ColumnStatus.unselected)
    })

    it("should be able to toggle a parents and change the selected status of it's children with dvc.views.experimentColumnsTree.toggleSelected", async () => {
      const toggleCommand = 'dvc.views.experimentColumnsTree.toggleSelected'
      const relPath = join('params', paramsFile)
      const absPath = join(dvcDemoPath, relPath)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((ExperimentsColumnsTree as any).prototype, 'getDetails').callsFake(
        path => [dvcDemoPath, relative(dvcDemoPath, path)]
      )

      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const experimentsTable = disposable.track(
        new ExperimentsTable(dvcDemoPath, internalCommands, resourceLocator)
      )

      await experimentsTable.isReady()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getTable').returns(experimentsTable)

      const selectedChildren = experimentsTable.getChildColumns(relPath) || []
      expect(selectedChildren).to.have.lengthOf.greaterThan(1)

      const selectedGrandChildren =
        experimentsTable.getChildColumns(join(relPath, 'process')) || []
      expect(selectedGrandChildren).to.have.lengthOf.greaterThan(1)

      const allChildren = [...selectedChildren, ...selectedGrandChildren]

      allChildren.map(column =>
        expect(experimentsTable.getColumn(column.path)?.isSelected).to.equal(
          ColumnStatus.selected
        )
      )

      expect(experimentsTable.getColumn(relPath)?.childSelectionInfo).to.equal(
        '8/8'
      )

      const isUnselected = await commands.executeCommand(toggleCommand, absPath)

      expect(isUnselected).to.equal(ColumnStatus.unselected)

      allChildren.map(column =>
        expect(experimentsTable.getColumn(column.path)?.isSelected).to.equal(
          isUnselected
        )
      )

      expect(experimentsTable.getColumn(relPath)?.childSelectionInfo).to.equal(
        '0/8'
      )
    })
  })

  it("should be able to select a child and set all it's ancestors' statuses to indeterminate with dvc.views.experimentColumnsTree.toggleSelected", async () => {
    const grandParentPath = join('params', paramsFile)
    const parentPath = join(grandParentPath, 'process')
    const absPath = join(dvcDemoPath, grandParentPath)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stub((ExperimentsColumnsTree as any).prototype, 'getDetails').callsFake(
      path => [dvcDemoPath, relative(dvcDemoPath, path)]
    )

    const config = disposable.track(new Config())
    const cliReader = disposable.track(new CliReader(config))
    stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)

    const internalCommands = disposable.track(
      new InternalCommands(config, cliReader)
    )

    const resourceLocator = disposable.track(
      new ResourceLocator(Uri.file(resourcePath))
    )
    const experimentsTable = disposable.track(
      new ExperimentsTable(dvcDemoPath, internalCommands, resourceLocator)
    )

    await experimentsTable.isReady()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stub((Experiments as any).prototype, 'getTable').returns(experimentsTable)

    const selectedChildren =
      experimentsTable.getChildColumns(grandParentPath) || []
    expect(selectedChildren).to.have.lengthOf.greaterThan(1)

    const selectedGrandChildren =
      experimentsTable.getChildColumns(parentPath) || []
    expect(selectedGrandChildren).to.have.lengthOf.greaterThan(1)

    const allColumns = [
      ...selectedChildren,
      { path: grandParentPath },
      ...selectedGrandChildren
    ]

    await commands.executeCommand(toggleCommand, absPath)

    allColumns.map(column =>
      expect(experimentsTable.getColumn(column.path)?.isSelected).to.equal(
        ColumnStatus.unselected
      )
    )

    const [firstGrandChild] = selectedGrandChildren

    const isSelected = await commands.executeCommand(
      toggleCommand,
      join(dvcDemoPath, firstGrandChild.path)
    )

    expect(isSelected).to.equal(ColumnStatus.selected)

    const parentColumn = experimentsTable.getColumn(parentPath)
    expect(parentColumn?.isSelected).to.equal(ColumnStatus.indeterminate)
    expect(parentColumn?.childSelectionInfo).to.equal('1/2')

    const grandParentColumn = experimentsTable.getColumn(grandParentPath)
    expect(grandParentColumn?.isSelected).to.equal(ColumnStatus.indeterminate)
    expect(grandParentColumn?.childSelectionInfo).to.equal('2/8')
  })

  it("should be able to unselect the last remaining selected child and set it's ancestors to unselected with dvc.views.experimentColumnsTree.toggleSelected", async () => {
    const grandParentPath = join('params', paramsFile)
    const parentPath = join(grandParentPath, 'process')
    const absPath = join(dvcDemoPath, grandParentPath)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stub((ExperimentsColumnsTree as any).prototype, 'getDetails').callsFake(
      path => [dvcDemoPath, relative(dvcDemoPath, path)]
    )

    const config = disposable.track(new Config())
    const cliReader = disposable.track(new CliReader(config))
    stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)

    const internalCommands = disposable.track(
      new InternalCommands(config, cliReader)
    )

    const resourceLocator = disposable.track(
      new ResourceLocator(Uri.file(resourcePath))
    )
    const experimentsTable = disposable.track(
      new ExperimentsTable(dvcDemoPath, internalCommands, resourceLocator)
    )

    await experimentsTable.isReady()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stub((Experiments as any).prototype, 'getTable').returns(experimentsTable)

    const selectedGrandChildren =
      experimentsTable.getChildColumns(parentPath) || []
    expect(selectedGrandChildren).to.have.lengthOf.greaterThan(1)

    await commands.executeCommand(toggleCommand, absPath)

    expect(selectedGrandChildren).to.have.lengthOf(2)

    const [firstGrandChild, secondGrandChild] = selectedGrandChildren

    const isSelected = await commands.executeCommand(
      toggleCommand,
      join(dvcDemoPath, firstGrandChild.path)
    )

    expect(isSelected).to.equal(ColumnStatus.selected)

    expect(
      experimentsTable.getColumn(secondGrandChild.path)?.isSelected
    ).to.equal(ColumnStatus.unselected)

    const lastSelectedIsUnselected = await commands.executeCommand(
      toggleCommand,
      join(dvcDemoPath, firstGrandChild.path)
    )

    expect(lastSelectedIsUnselected).to.equal(ColumnStatus.unselected)

    const parentColumn = experimentsTable.getColumn(parentPath)
    expect(parentColumn?.isSelected).to.equal(lastSelectedIsUnselected)
    expect(parentColumn?.childSelectionInfo).to.equal('0/2')

    const grandParentColumn = experimentsTable.getColumn(grandParentPath)
    expect(grandParentColumn?.isSelected).to.equal(lastSelectedIsUnselected)
    expect(grandParentColumn?.childSelectionInfo).to.equal('0/8')
  })
})
