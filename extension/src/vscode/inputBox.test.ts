import { window } from 'vscode'
import { mocked } from 'ts-jest/utils'
import { getInput } from './inputBox'

jest.mock('vscode')

const mockedWindow = mocked(window)
const mockedInputBox = mockedWindow.showInputBox

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getInput', () => {
  it('should call window.showInputBox with the provided title', async () => {
    const aggressiveText = 'TELL ME WHAT YOU WANT'
    await getInput(aggressiveText)
    expect(mockedInputBox).toBeCalledTimes(1)
    expect(mockedInputBox).toBeCalledWith({ title: aggressiveText })
  })
})
