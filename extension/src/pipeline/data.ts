import { dirname } from 'path'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { BaseData } from '../data'
import { findFiles } from '../fileSystem/workspace'
import { isPathInProject } from '../fileSystem'
import { TEMP_EXP_DIR } from '../cli/dvc/constants'

export class PipelineData extends BaseData<{
  dag: string
  stages: { [pipeline: string]: string | undefined }
}> {
  private readonly subProjects: string[]

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    subProjects: string[]
  ) {
    super(
      dvcRoot,
      internalCommands,
      [{ name: 'update', process: () => this.update() }],
      subProjects,
      ['dvc.yaml']
    )

    this.subProjects = subProjects
    this.waitForInitialData()
  }

  public managedUpdate() {
    return this.processManager.run('update')
  }

  public async update(): Promise<void> {
    const [dag, fileList] = await Promise.all([
      this.internalCommands.executeCommand(AvailableCommands.DAG, this.dvcRoot),
      this.findDvcYamls()
    ])

    const dvcYamlsDirs = new Set<string>()
    this.collectedFiles = []
    for (const file of fileList) {
      if (isPathInProject(file, this.dvcRoot, this.subProjects)) {
        this.collectedFiles.push(file)
        dvcYamlsDirs.add(dirname(file))
      }
    }

    const stages: { [dir: string]: string } = {}
    for (const dir of dvcYamlsDirs) {
      stages[dir] = await this.internalCommands.executeCommand(
        AvailableCommands.STAGE_LIST,
        dir
      )
    }

    return this.notifyChanged({ dag, stages })
  }

  private async findDvcYamls() {
    const dvcYamls = await findFiles('**/dvc.yaml')
    return dvcYamls.filter(file => !file.includes(TEMP_EXP_DIR))
  }
}
