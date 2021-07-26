import { join, relative, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { window, commands, Uri } from 'vscode'
import { Disposable } from '../../../../extension'
import complexExperimentsOutput from '../../../../experiments/webview/complex-output-example.json'
import { ExperimentsColumnsTree } from '../../../../experiments/views/columnsTree'
import { Experiments } from '../../../../experiments'
import { ExperimentsRepository } from '../../../../experiments/repository'
import { Status } from '../../../../experiments/model/paramsAndMetrics'
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
  const toggleCommand = 'dvc.views.experimentsColumnsTree.toggleStatus'
  const paramsFile = 'params.yaml'
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('experimentsColumnsTree', () => {
    it('should be able to toggle whether an experiments param or metric is selected with dvc.views.experimentsColumnsTree.toggleStatus', async () => {
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

      const isUnselected = await commands.executeCommand(toggleCommand, absPath)

      expect(isUnselected).to.equal(Status.unselected)

      const isSelected = await commands.executeCommand(toggleCommand, absPath)

      expect(isSelected).to.equal(Status.selected)

      const isUnselectedAgain = await commands.executeCommand(
        toggleCommand,
        absPath
      )

      expect(isUnselectedAgain).to.equal(Status.unselected)
    })

    it("should be able to toggle a parents and change the selected status of it's children with dvc.views.experimentsColumnsTree.toggleStatus", async () => {
      const toggleCommand = 'dvc.views.experimentsColumnsTree.toggleStatus'
      const relPath = join('params', paramsFile)
      const absPath = join(dvcDemoPath, relPath)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((ExperimentsColumnsTree as any).prototype, 'getDetails').callsFake(
        (path: string) => [dvcDemoPath, relative(dvcDemoPath, path)]
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
        experimentsRepository.getChildParamsOrMetrics(relPath) || []
      expect(selectedChildren).to.have.lengthOf.greaterThan(1)

      const selectedGrandChildren =
        experimentsRepository.getChildParamsOrMetrics(
          join(relPath, 'process')
        ) || []
      expect(selectedGrandChildren).to.have.lengthOf.greaterThan(1)

      const allChildren = [...selectedChildren, ...selectedGrandChildren]

      allChildren.map(paramOrMetric =>
        expect(
          experimentsRepository.getParamOrMetric(paramOrMetric.path)?.status
        ).to.equal(Status.selected)
      )

      expect(
        experimentsRepository.getParamOrMetric(relPath)?.descendantMetadata
      ).to.equal('8/8')

      const isUnselected = await commands.executeCommand(toggleCommand, absPath)

      expect(isUnselected).to.equal(Status.unselected)

      allChildren.map(paramOrMetric =>
        expect(
          experimentsRepository.getParamOrMetric(paramOrMetric.path)?.status
        ).to.equal(isUnselected)
      )

      expect(
        experimentsRepository.getParamOrMetric(relPath)?.descendantMetadata
      ).to.equal('0/8')
    })
  })

  it("should be able to select a child and set all it's ancestors' statuses to indeterminate with dvc.views.experimentsColumnsTree.toggleStatus", async () => {
    const grandParentPath = join('params', paramsFile)
    const parentPath = join(grandParentPath, 'process')
    const absPath = join(dvcDemoPath, grandParentPath)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stub((ExperimentsColumnsTree as any).prototype, 'getDetails').callsFake(
      (path: string) => [dvcDemoPath, relative(dvcDemoPath, path)]
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
    const experimentsRepository = disposable.track(
      new ExperimentsRepository(dvcDemoPath, internalCommands, resourceLocator)
    )

    await experimentsRepository.isReady()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stub((Experiments as any).prototype, 'getRepository').returns(
      experimentsRepository
    )

    const selectedChildren =
      experimentsRepository.getChildParamsOrMetrics(grandParentPath) || []
    expect(selectedChildren).to.have.lengthOf.greaterThan(1)

    const selectedGrandChildren =
      experimentsRepository.getChildParamsOrMetrics(parentPath) || []
    expect(selectedGrandChildren).to.have.lengthOf.greaterThan(1)

    const allColumns = [
      ...selectedChildren,
      { path: grandParentPath },
      ...selectedGrandChildren
    ]

    await commands.executeCommand(toggleCommand, absPath)

    allColumns.map(paramOrMetric =>
      expect(
        experimentsRepository.getParamOrMetric(paramOrMetric.path)?.status
      ).to.equal(Status.unselected)
    )

    const [firstGrandChild] = selectedGrandChildren

    const isSelected = await commands.executeCommand(
      toggleCommand,
      join(dvcDemoPath, firstGrandChild.path)
    )

    expect(isSelected).to.equal(Status.selected)

    const parentColumn = experimentsRepository.getParamOrMetric(parentPath)
    expect(parentColumn?.status).to.equal(Status.indeterminate)
    expect(parentColumn?.descendantMetadata).to.equal('1/2')

    const grandParentColumn =
      experimentsRepository.getParamOrMetric(grandParentPath)
    expect(grandParentColumn?.status).to.equal(Status.indeterminate)
    expect(grandParentColumn?.descendantMetadata).to.equal('2/8')
  })

  it("should be able to unselect the last remaining selected child and set it's ancestors to unselected with dvc.views.experimentsColumnsTree.toggleStatus", async () => {
    const grandParentPath = join('params', paramsFile)
    const parentPath = join(grandParentPath, 'process')
    const absPath = join(dvcDemoPath, grandParentPath)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stub((ExperimentsColumnsTree as any).prototype, 'getDetails').callsFake(
      (path: string) => [dvcDemoPath, relative(dvcDemoPath, path)]
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
    const experimentsRepository = disposable.track(
      new ExperimentsRepository(dvcDemoPath, internalCommands, resourceLocator)
    )

    await experimentsRepository.isReady()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stub((Experiments as any).prototype, 'getRepository').returns(
      experimentsRepository
    )

    const selectedGrandChildren =
      experimentsRepository.getChildParamsOrMetrics(parentPath) || []
    expect(selectedGrandChildren).to.have.lengthOf.greaterThan(1)

    await commands.executeCommand(toggleCommand, absPath)

    expect(selectedGrandChildren).to.have.lengthOf(2)

    const [firstGrandChild, secondGrandChild] = selectedGrandChildren

    const isSelected = await commands.executeCommand(
      toggleCommand,
      join(dvcDemoPath, firstGrandChild.path)
    )

    expect(isSelected).to.equal(Status.selected)

    expect(
      experimentsRepository.getParamOrMetric(secondGrandChild.path)?.status
    ).to.equal(Status.unselected)

    const lastSelectedIsUnselected = await commands.executeCommand(
      toggleCommand,
      join(dvcDemoPath, firstGrandChild.path)
    )

    expect(lastSelectedIsUnselected).to.equal(Status.unselected)

    const parentColumn = experimentsRepository.getParamOrMetric(parentPath)
    expect(parentColumn?.status).to.equal(lastSelectedIsUnselected)
    expect(parentColumn?.descendantMetadata).to.equal('0/2')

    const grandParentColumn =
      experimentsRepository.getParamOrMetric(grandParentPath)
    expect(grandParentColumn?.status).to.equal(lastSelectedIsUnselected)
    expect(grandParentColumn?.descendantMetadata).to.equal('0/8')
  })
})
