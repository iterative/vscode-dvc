import path from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { window, commands, Uri } from 'vscode'
import { Disposable } from '../../../../extension'
import complexExperimentsOutput from '../../../../experiments/webview/complex-output-example.json'
import { ExperimentsColumnsTree } from '../../../../experiments/views/columnsTree'
import { Experiments } from '../../../../experiments'
import { ExperimentsTable } from '../../../../experiments/table'
import { ResourceLocator } from '../../../../resourceLocator'
import { Config } from '../../../../config'
import { CliReader } from '../../../../cli/reader'
import { InternalCommands } from '../../../../internalCommands'

suite('Extension Test Suite', () => {
  window.showInformationMessage('Start all experiment columns tree tests.')

  const { join, resolve } = path

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
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('ExperimentColumnsTree', () => {
    it('should be able to toggle whether an experiments column is selected with dvc.views.experimentColumnsTree.toggleSelected', async () => {
      const relPath = join('params', 'params.yaml', 'learning_rate')
      const absPath = join(
        dvcDemoPath,
        'params',
        'params.yaml',
        'learning_rate'
      )
      stub(path, 'relative').returns(relPath)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((ExperimentsColumnsTree as any).prototype, 'getElementRoot').returns(
        dvcDemoPath
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

      const isUnselected = await commands.executeCommand(
        'dvc.views.experimentColumnsTree.toggleSelected',
        absPath
      )

      expect(isUnselected).to.be.false

      const isSelected = await commands.executeCommand(
        'dvc.views.experimentColumnsTree.toggleSelected',
        absPath
      )

      expect(isSelected).to.be.true
    })
  })
})
