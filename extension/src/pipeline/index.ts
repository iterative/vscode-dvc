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
import { quickPickOneOrInput } from '../vscode/quickPick'
import { pickFile } from '../vscode/resourcePicker'

enum scriptCommand {
  JUPYTER = 'jupyter nbconvert --to notebook --inplace --execute',
  PYTHON = 'python'
}

const getScriptCommand = (script: string) => {
  switch (getFileExtension(script)) {
    case '.py':
      return scriptCommand.PYTHON
    case '.ipynb':
      return scriptCommand.JUPYTER
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

  constructor(dvcRoot: string, internalCommands: InternalCommands) {
    super()
    this.dvcRoot = dvcRoot
    this.data = this.dispose.track(new PipelineData(dvcRoot, internalCommands))
    this.model = this.dispose.track(new PipelineModel(dvcRoot))
    this.updated = this.dispose.track(new EventEmitter<void>())
    this.onDidUpdate = this.updated.event

    void this.initialize()
  }

  public hasStage() {
    return this.model.hasStage()
  }

  public hasInvalidRootDvcYaml() {
    return this.model.hasInvalidRootDvcYaml()
  }

  public async checkOrAddPipeline() {
    const hasStage = this.model.hasStage()
    if (this.hasInvalidRootDvcYaml()) {
      await Toast.showError(
        'Cannot perform task. Your dvc.yaml file is invalid.'
      )
      return false
    }

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
        const hasInvalidRootDvcYaml = this.model.hasInvalidRootDvcYaml()
        this.model.transformAndSet(stages)
        if (
          hasStage !== this.model.hasStage() ||
          hasInvalidRootDvcYaml !== this.model.hasInvalidRootDvcYaml()
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
