import { collectErrors, collectImageErrors } from './collect'
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
}
