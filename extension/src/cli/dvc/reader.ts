import isEmpty from 'lodash.isempty'
import { DvcCli } from '.'
import {
  Args,
  Command,
  ExperimentFlag,
  Flag,
  NUM_OF_COMMITS_TO_SHOW,
  SubCommand,
  TEMP_PLOTS_DIR
} from './constants'
import {
  DataStatusOutput,
  DvcError,
  ExperimentsOutput,
  EXPERIMENT_WORKSPACE_ID,
  PlotsOutput,
  PlotsOutputOrError
} from './contract'
import { getOptions } from './options'
import { typeCheckCommands } from '..'
import { MaybeConsoleError } from '../error'
import { Logger } from '../../common/logger'
import { parseNonStandardJson } from '../../util/json'

const defaultExperimentsOutput: ExperimentsOutput = {
  [EXPERIMENT_WORKSPACE_ID]: { baseline: {} }
}

export const isDvcError = <
  T extends ExperimentsOutput | DataStatusOutput | PlotsOutput
>(
  dataOrError: T | DvcError
): dataOrError is DvcError =>
  !!(Object.keys(dataOrError).length === 1 && (dataOrError as DvcError).error)

export const autoRegisteredCommands = {
  DATA_STATUS: 'dataStatus',
  EXP_SHOW: 'expShow',
  GLOBAL_VERSION: 'globalVersion',
  PLOTS_DIFF: 'plotsDiff',
  ROOT: 'root',
  STAGE_LIST: 'listStages',
  VERSION: 'version'
} as const

export class DvcReader extends DvcCli {
  public readonly autoRegisteredCommands = typeCheckCommands(
    autoRegisteredCommands,
    this
  )

  public dataStatus(
    cwd: string,
    ...args: Args
  ): Promise<DataStatusOutput | DvcError> {
    return this.readProcessJson<DataStatusOutput>(
      cwd,
      Command.DATA,
      SubCommand.STATUS,
      Flag.GRANULAR,
      Flag.UNCHANGED,
      ...args
    )
  }

  public async expShow(
    cwd: string,
    ...flags: (ExperimentFlag | string)[]
  ): Promise<ExperimentsOutput> {
    const output = await this.readProcess<ExperimentsOutput>(
      cwd,
      JSON.stringify(defaultExperimentsOutput),
      Command.EXPERIMENT,
      SubCommand.SHOW,
      Flag.NUM_COMMIT,
      NUM_OF_COMMITS_TO_SHOW,
      ...flags,
      Flag.JSON
    )
    if (isDvcError(output) || isEmpty(output)) {
      return {
        [EXPERIMENT_WORKSPACE_ID]: { baseline: output as DvcError | {} }
      }
    }
    return output
  }

  public plotsDiff(
    cwd: string,
    ...revisions: string[]
  ): Promise<PlotsOutputOrError> {
    return this.readProcessJson<PlotsOutput>(
      cwd,
      Command.PLOTS,
      SubCommand.DIFF,
      ...revisions,
      Flag.OUTPUT_PATH,
      TEMP_PLOTS_DIR,
      Flag.SPLIT
    )
  }

  public async root(cwd: string): Promise<string | undefined> {
    try {
      return await this.executeDvcProcess(cwd, Command.ROOT)
    } catch {}
  }

  public version(cwd: string): Promise<string> {
    return this.executeDvcProcess(cwd, Flag.VERSION)
  }

  public globalVersion(cwd: string): Promise<string> {
    const options = getOptions(
      undefined,
      this.config.getCliPath(),
      cwd,
      Flag.VERSION
    )

    return this.executeProcess(options)
  }

  public async listStages(cwd: string): Promise<string | undefined> {
    try {
      return await this.executeDvcProcess(cwd, Command.STAGE, SubCommand.LIST)
    } catch {}
  }

  private readProcessJson<T extends DataStatusOutput | PlotsOutput>(
    cwd: string,
    command: Command,
    ...args: Args
  ) {
    return this.readProcess<T>(cwd, '{}', command, ...args, Flag.JSON)
  }

  private async readProcess<
    T extends DataStatusOutput | ExperimentsOutput | PlotsOutput
  >(cwd: string, defaultValue: string, ...args: Args): Promise<T | DvcError> {
    try {
      const output =
        (await this.executeDvcProcess(cwd, ...args)) || defaultValue
      return parseNonStandardJson<T>(output)
    } catch (error: unknown) {
      const msg =
        (error as MaybeConsoleError).stderr || (error as Error).message
      Logger.error(`${args.join(' ')} failed with ${msg}`)
      return { error: { msg, type: 'Caught error' } }
    }
  }
}
