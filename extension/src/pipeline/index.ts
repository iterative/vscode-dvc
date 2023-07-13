import { join } from 'path'
import { Event, EventEmitter } from 'vscode'
import { appendFileSync, writeFileSync } from 'fs-extra'
import { PipelineData } from './data'
import { PipelineModel } from './model'
import { DeferredDisposable } from '../class/deferred'
import { InternalCommands } from '../commands/internal'
import { TEMP_DAG_FILE } from '../cli/dvc/constants'
import { findOrCreateDvcYamlFile, getFileExtension } from '../fileSystem'
import { Toast } from '../vscode/toast'
import { getInput, getValidInput } from '../vscode/inputBox'
import { Title } from '../vscode/title'
import { quickPickOne, quickPickOneOrInput } from '../vscode/quickPick'
import { pickFile } from '../vscode/resourcePicker'

export enum ScriptCommand {
  JUPYTER = 'jupyter nbconvert --to notebook --inplace --execute',
  PYTHON = 'python'
}

const getScriptCommand = (script: string) => {
  switch (getFileExtension(script)) {
    case '.py':
      return ScriptCommand.PYTHON
    case '.ipynb':
      return ScriptCommand.JUPYTER
    default:
      return ''
  }
}

export class Pipeline extends DeferredDisposable {
  public onDidUpdate: Event<void>

  private updated: EventEmitter<void>

  private readonly dvcRoot: string
  private readonly data: PipelineData
  private readonly model: PipelineModel

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    data?: PipelineData
  ) {
    super()
    this.dvcRoot = dvcRoot
    this.data = this.dispose.track(
      data || new PipelineData(dvcRoot, internalCommands)
    )
    this.model = this.dispose.track(new PipelineModel(dvcRoot))
    this.updated = this.dispose.track(new EventEmitter<void>())
    this.onDidUpdate = this.updated.event

    void this.initialize()
  }

  public hasStage() {
    return this.model.hasStage()
  }

  public hasPipeline() {
    return this.model.hasPipeline()
  }

  public getCwd() {
    const hasPipeline = this.checkOrAddPipeline() // need to refactor if we are going to run the original command
    if (!hasPipeline) {
      return
    }

    const pipelines = this.model.getPipelines()
    if (!pipelines?.size) {
      return
    }
    if (pipelines.has(this.dvcRoot)) {
      return this.dvcRoot
    }
    if (pipelines.size === 1) {
      return [...pipelines][0]
    }

    return quickPickOne(
      [...pipelines],
      'Select a Pipeline to Run Command Against'
    )
  }

  public checkOrAddPipeline() {
    const hasStage = this.model.hasStage()

    if (!hasStage) {
      return this.addPipeline()
    }
    return true
  }

  public forceRerender() {
    return appendFileSync(join(this.dvcRoot, TEMP_DAG_FILE), '\n')
  }

  private async initialize() {
    this.dispose.track(
      this.data.onDidUpdate(({ dag, stages }) => {
        this.writeDag(dag)
        const hasStage = this.model.hasStage()
        const hasPipeline = this.model.hasPipeline()
        this.model.transformAndSet(stages)
        if (
          hasStage !== this.model.hasStage() ||
          hasPipeline !== this.model.hasPipeline()
        ) {
          this.updated.fire()
        }
      })
    )

    await this.data.isReady()
    return this.deferred.resolve()
  }

  private async addPipeline() {
    const stageName = await this.askForStageName()
    if (!stageName) {
      return false
    }

    const { trainingScript, command, enteredManually } =
      await this.askForTrainingScript()
    if (!trainingScript) {
      return false
    }
    void findOrCreateDvcYamlFile(
      this.dvcRoot,
      trainingScript,
      stageName,
      command,
      !enteredManually
    )
    return true
  }

  private async askForStageName() {
    return await getValidInput(
      Title.ENTER_STAGE_NAME,
      (stageName?: string) => {
        if (!stageName) {
          return 'Stage name must not be empty'
        }
        if (!/^[a-z]/i.test(stageName)) {
          return 'Stage name should start with a letter'
        }
        return /^\w+$/.test(stageName)
          ? null
          : 'Stage name should only include letters and numbers'
      },
      { value: 'train' }
    )
  }

  private async askForTrainingScript() {
    const selectValue = 'select'
    const pathOrSelect = await quickPickOneOrInput(
      [{ label: 'Select from file explorer', value: selectValue }],
      {
        defaultValue: '',
        placeholder: 'Path to script',
        title: Title.ENTER_PATH_OR_CHOOSE_FILE
      }
    )

    const trainingScript =
      pathOrSelect === selectValue
        ? await pickFile(Title.SELECT_TRAINING_SCRIPT)
        : pathOrSelect

    if (!trainingScript) {
      return {
        command: undefined,
        enteredManually: false,
        trainingScript: undefined
      }
    }

    const command =
      getScriptCommand(trainingScript) ||
      (await getInput(Title.ENTER_COMMAND_TO_RUN)) ||
      ''
    const enteredManually = pathOrSelect !== selectValue
    return { command, enteredManually, trainingScript }
  }

  private writeDag(dag: string) {
    writeFileSync(join(this.dvcRoot, TEMP_DAG_FILE), dag)
  }
}
