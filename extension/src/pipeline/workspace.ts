import { join } from 'path'
import { commands, Uri } from 'vscode'
import { Pipeline } from '.'
import { TEMP_DAG_FILE } from '../cli/dvc/constants'
import { BaseWorkspace } from '../workspace'
import {
  MARKDOWN_MERMAID_EXTENSION_ID,
  recommendMermaidSupportExtension
} from '../vscode/recommend'
import { InternalCommands } from '../commands/internal'
import { getOnDidChangeExtensions, isInstalled } from '../vscode/extensions'

export class WorkspacePipeline extends BaseWorkspace<Pipeline> {
  private isMermaidSupportInstalled = isInstalled(MARKDOWN_MERMAID_EXTENSION_ID)

  private focusedProject: string | undefined

  constructor(internalCommands: InternalCommands) {
    super(internalCommands)

    const onDidChangeExtensions = getOnDidChangeExtensions()
    this.dispose.track(
      onDidChangeExtensions(() => {
        const wasMermaidInstalled = this.isMermaidSupportInstalled
        this.isMermaidSupportInstalled = isInstalled(
          MARKDOWN_MERMAID_EXTENSION_ID
        )
        if (!wasMermaidInstalled && this.isMermaidSupportInstalled) {
          this.renderDagAsMermaid()
        }
      })
    )
  }

  public createRepository(dvcRoot: string, subProjects: string[]) {
    const pipeline = this.dispose.track(
      new Pipeline(dvcRoot, this.internalCommands, subProjects)
    )

    this.setRepository(dvcRoot, pipeline)

    this.dispose.track(
      pipeline.onDidFocusProject(project => {
        this.focusedProject = project
      })
    )

    return pipeline
  }

  public async showDag() {
    const cwd = await this.getCwd()

    if (!cwd) {
      return
    }

    void recommendMermaidSupportExtension()

    return commands.executeCommand(
      'markdown.showPreview',
      Uri.file(join(cwd, TEMP_DAG_FILE))
    )
  }

  public async addTopLevelPlot(overrideRoot?: string) {
    const cwd = overrideRoot || (await this.getCwd())

    if (!cwd) {
      return
    }

    void this.getRepository(cwd).addTopLevelPlot()
  }

  private getCwd() {
    return this.focusedProject || this.getOnlyOrPickProject()
  }

  private renderDagAsMermaid() {
    for (const dvcRoot of this.getDvcRoots()) {
      void this.getRepository(dvcRoot).forceRerender()
    }
  }
}
