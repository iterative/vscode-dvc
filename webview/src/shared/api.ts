export interface InternalVsCodeApi {
  getState<T>(): T
  setState<T>(state: T): void
  postMessage<T>(message: T): void
}
