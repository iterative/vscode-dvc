import { EventEmitter, Event } from 'vscode'
import { Disposable } from '@hediet/std/disposable'

export interface UpdatableData<T, E = Error> {
  getData: () => T | undefined
  update: () => Thenable<T>
  onDidStartDataUpdate: Event<Thenable<T>>
  onDidFailDataUpdate: Event<E>
  onDidUpdateData: Event<T>
  dispose: () => void
}

export class AsyncFunctionUpdatableData<T> implements UpdatableData<T> {
  private callback: () => Thenable<T>

  private currentUpdatePromise?: Thenable<T>

  private data?: T
  public getData() {
    return this.data
  }

  public readonly dispose = Disposable.fn()

  private dataUpdateStarted: EventEmitter<Thenable<T>> = this.dispose.track(
    new EventEmitter()
  )

  public readonly onDidStartDataUpdate = this.dataUpdateStarted.event

  private dataUpdated: EventEmitter<T> = this.dispose.track(new EventEmitter())

  public readonly onDidUpdateData = this.dataUpdated.event

  private dataUpdateFailed: EventEmitter<Error> = this.dispose.track(
    new EventEmitter()
  )

  public readonly onDidFailDataUpdate = this.dataUpdateFailed.event

  private async performUpdate(): Promise<T> {
    const updatePromise = this.callback()
    this.currentUpdatePromise = updatePromise
    this.dataUpdateStarted.fire(updatePromise)
    try {
      const experimentData = await updatePromise
      this.dataUpdated.fire(experimentData)
      return experimentData
    } catch (e) {
      this.dataUpdateFailed.fire(e)
      throw e
    } finally {
      this.currentUpdatePromise = undefined
    }
  }

  public update(): Thenable<T> {
    if (!this.currentUpdatePromise) {
      this.currentUpdatePromise = this.performUpdate()
    }
    return this.currentUpdatePromise as Promise<T>
  }

  constructor(callback: () => Thenable<T>) {
    this.callback = callback
  }
}
