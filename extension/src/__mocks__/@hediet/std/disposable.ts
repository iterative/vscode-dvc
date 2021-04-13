export const Disposable = {
  fn: jest.fn().mockReturnValue({
    track: jest.fn().mockImplementation(function<T>(disposable: T): T {
      return disposable
    })
  })
}
