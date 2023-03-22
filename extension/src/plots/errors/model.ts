import { join } from 'path'
import {
  collectErrors,
  collectImageErrors,
  collectPathErrorsTable
} from './collect'
import { Disposable } from '../../class/dispose'
import { PlotError, PlotsOutputOrError } from '../../cli/dvc/contract'
import { isDvcError } from '../../cli/dvc/reader'

export class ErrorsModel extends Disposable {
  private readonly dvcRoot: string

  private errors: PlotError[] = []

  constructor(dvcRoot: string) {
    super()
    this.dvcRoot = dvcRoot
  }

  public transformAndSet(
    data: PlotsOutputOrError,
    revs: string[],
    cliIdToLabel: { [id: string]: string }
  ) {
    if (isDvcError(data)) {
      return
    }

    this.errors = collectErrors(data, revs, this.errors, cliIdToLabel)
  }

  public getImageErrors(path: string, revision: string) {
    return collectImageErrors(path, revision, this.errors)
  }

  public getPathErrors(path: string, selectedRevisions: string[]) {
    return collectPathErrorsTable(path, selectedRevisions, this.errors)
  }

  public getErrorPaths(selectedRevisions: string[]) {
    const acc = new Set<string>()
    for (const { name, rev } of this.errors) {
      if (selectedRevisions.includes(rev)) {
        acc.add(join(this.dvcRoot, name))
      }
    }
    return acc
  }
}
