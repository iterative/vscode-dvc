import { window } from 'vscode'
import { mocked } from 'ts-jest/utils'
import { quickPickOne } from './quickPick'

const mockedWindow = mocked(window)

jest.mock('vscode')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('quickPickOne', () => {
  it('should call window.quickPick with the correct arguments', async () => {
    const placeHolder = 'my placeholder'
    await quickPickOne(['a', 'b', 'c'], placeHolder)
    expect(mockedWindow.showQuickPick).toBeCalledWith(['a', 'b', 'c'], {
      canPickMany: false,
      placeHolder
    })
  })
})
