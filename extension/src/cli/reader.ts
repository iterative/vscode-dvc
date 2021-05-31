import { Cli } from '.'
import {
  Args,
  Command,
  ExperimentFlag,
  ExperimentSubCommand,
  Flag,
  ListFlag
} from './args'
import { ExperimentsRepoJSONOutput } from '../experiments/Webview/contract'
import { trimAndSplit } from '../util/stdout'

export type PathOutput = { path: string }

export type DiffOutput = {
  added?: PathOutput[]
  deleted?: PathOutput[]
  modified?: PathOutput[]
  renamed?: PathOutput[]
  'not in cache'?: PathOutput[]
}

export type ListOutput = {
  isdir: boolean
  isexec: boolean
  isout: boolean
  path: string
}

export enum Status {
  DELETED = 'deleted',
  MODIFIED = 'modified',
  NEW = 'new',
  NOT_IN_CACHE = 'not in cache'
}

export enum ChangedType {
  CHANGED_OUTS = 'changed outs',
  CHANGED_DEPS = 'changed deps'
}

export type PathStatus = Record<string, Status>

export type StageOrFileStatuses = Record<ChangedType, PathStatus>

export type StatusesOrAlwaysChanged = StageOrFileStatuses | 'always changed'

export type StatusOutput = Record<string, StatusesOrAlwaysChanged[]>

export class CliReader extends Cli {
  private async readProcess<T = string>(
    cwd: string,
    formatter: typeof trimAndSplit | typeof JSON.parse,
    ...args: Args
  ): Promise<T> {
    const output = await this.executeProcess(cwd, ...args)
    if (!formatter) {
      return (output as unknown) as T
    }
    return (formatter(output) as unknown) as T
  }

  private readProcessJson<T>(cwd: string, command: Command, ...args: Args) {
    return this.readProcess<T>(
      cwd,
      JSON.parse,
      command,
      ...args,
      Flag.SHOW_JSON
    )
  }

  public experimentListCurrent(cwd: string): Promise<string[]> {
    return this.readProcess<string[]>(
      cwd,
      trimAndSplit,
      Command.EXPERIMENT,
      ExperimentSubCommand.LIST,
      ExperimentFlag.NAMES_ONLY
    )
  }

  public experimentShow(cwd: string): Promise<ExperimentsRepoJSONOutput> {
    return this.readProcessJson<ExperimentsRepoJSONOutput>(
      cwd,
      Command.EXPERIMENT,
      ExperimentSubCommand.SHOW
    )
  }

  public diff(cwd: string): Promise<DiffOutput> {
    return this.readProcessJson<DiffOutput>(cwd, Command.DIFF)
  }

  public listDvcOnly(cwd: string, relativePath: string): Promise<ListOutput[]> {
    return this.readProcessJson<ListOutput[]>(
      cwd,
      Command.LIST,
      ListFlag.LOCAL_REPO,
      relativePath,
      ListFlag.DVC_ONLY
    )
  }

  public listDvcOnlyRecursive(cwd: string): Promise<ListOutput[]> {
    return this.readProcessJson<ListOutput[]>(
      cwd,
      Command.LIST,
      ListFlag.LOCAL_REPO,
      ListFlag.DVC_ONLY,
      Flag.RECURSIVE
    )
  }

  public async root(cwd: string): Promise<string | undefined> {
    try {
      return await this.executeProcess(cwd, Command.ROOT)
    } catch (error) {}
  }

  public status(cwd: string): Promise<StatusOutput> {
    return this.readProcessJson<StatusOutput>(cwd, Command.STATUS)
  }
}
