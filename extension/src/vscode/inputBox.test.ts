import { window } from 'vscode'
import { getInput } from './inputBox'
import { Title } from './title'

jest.mock('vscode')

const mockedWindow = jest.mocked(window)
const mockedInputBox = mockedWindow.showInputBox

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getInput', () => {
  it('should call window.showInputBox with the provided title', async () => {
    const aggressiveText = 'TELL ME WHAT YOU WANT' as Title
    await getInput(aggressiveText)
    expect(mockedInputBox).toHaveBeenCalledTimes(1)
    expect(mockedInputBox).toHaveBeenCalledWith({ title: aggressiveText })
  })
})
