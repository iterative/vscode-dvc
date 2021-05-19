import { window } from 'vscode'
import { mocked } from 'ts-jest/utils'
import { quickPickSingle } from './quickPick'

const mockedWindow = mocked(window)

jest.mock('vscode')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('quickPickSingle', () => {
  it('should call window.quickPick with the correct arguments', async () => {
    const placeHolder = 'my placeholder'
    await quickPickSingle(['a', 'b', 'c'], placeHolder)
    expect(mockedWindow.showQuickPick).toBeCalledWith(['a', 'b', 'c'], {
      canPickMany: false,
      placeHolder
    })
  })
})
