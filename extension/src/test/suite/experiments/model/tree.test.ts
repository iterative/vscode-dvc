import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, spy } from 'sinon'
import {
  commands,
  EventEmitter,
  TreeView,
  TreeViewExpansionEvent,
  window
} from 'vscode'
import { Disposable } from '../../../../extension'
import {
  ExperimentItem,
  ExperimentsTree
} from '../../../../experiments/model/tree'
import { buildSingleRepoExperiments } from '../util'
import { ResourceLocator } from '../../../../resourceLocator'
import { InternalCommands } from '../../../../commands/internal'

suite('Experiments Tree Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('ExperimentsTree', () => {
    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand('dvc.views.experimentsTree.focus')
      ).to.be.eventually.equal(undefined)
    })

    it('should retain the expanded state of experiment tree items', () => {
      const { workspaceExperiments } = buildSingleRepoExperiments(disposable)

      const elementCollapsed = disposable.track(
        new EventEmitter<TreeViewExpansionEvent<ExperimentItem>>()
      )
      const elementExpanded = disposable.track(
        new EventEmitter<TreeViewExpansionEvent<ExperimentItem>>()
      )

      stub(window, 'createTreeView').returns({
        dispose: stub(),
        onDidCollapseElement: elementCollapsed.event,
        onDidExpandElement: elementExpanded.event
      } as unknown as TreeView<string | ExperimentItem>)

      const experimentsTree = disposable.track(
        new ExperimentsTree(
          workspaceExperiments,
          { registerExternalCommand: stub() } as unknown as InternalCommands,
          {} as ResourceLocator
        )
      )

      const description = '[exp-1234]'

      const setExpandedSpy = spy(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        experimentsTree as any,
        'setExperimentExpanded'
      )

      elementExpanded.fire({ element: { description } as ExperimentItem })

      expect(
        setExpandedSpy,
        'the experiment should be set to expanded'
      ).to.be.calledOnceWith(description, true)

      setExpandedSpy.resetHistory()

      elementCollapsed.fire({ element: { description } as ExperimentItem })

      expect(
        setExpandedSpy,
        'the experiment should be set to collapsed'
      ).to.be.calledOnceWith(description, false)
    })
  })
})
