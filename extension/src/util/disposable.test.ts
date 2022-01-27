import { Disposable, Disposer } from '@hediet/std/disposable'
import { reset } from './disposable'

const mockedDisposable = jest.mocked(Disposable)
const mockedDispose = jest.fn()
const mockedUntrack = jest.fn()

jest.mock('@hediet/std/disposable')

beforeEach(() => {
  jest.resetAllMocks()
  mockedDisposable.fn.mockReturnValue({
    dispose: mockedDispose,
    track: function <T>(disposable: T): T {
      return disposable
    },
    untrack: mockedUntrack
  } as unknown as (() => void) & Disposer)
})

describe('reset', () => {
  it('should reset the disposables object to an empty object', () => {
    const disposer = Disposable.fn()
    const bDisposable = disposer.track(Disposable.fn())
    const aDisposable = disposer.track(Disposable.fn())
    let disposables: Record<string, Disposer> = { aDisposable, bDisposable }

    disposables = reset<Disposer>(disposables, disposer)

    expect(disposables).toEqual({})
  })

  it('should call dispose on all of the disposables', () => {
    const disposer = Disposable.fn()
    const aDisposable = disposer.track(Disposable.fn())
    const bDisposable = disposer.track(Disposable.fn())
    const cDisposable = disposer.track(Disposable.fn())
    const disposables = { aDisposable, bDisposable, cDisposable }

    reset(disposables, disposer)

    expect(mockedDispose).toBeCalledTimes(3)
  })

  it('should stop the disposer tracking the disposables', () => {
    const disposer = Disposable.fn()

    const disposable = disposer.track(Disposable.fn())
    const disposables = { aDisposable: disposable }

    reset(disposables, disposer)

    expect(mockedUntrack).toBeCalledWith(disposable)
  })
})
