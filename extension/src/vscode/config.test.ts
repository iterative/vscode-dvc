import { workspace } from 'vscode'
import { mocked } from 'ts-jest/utils'
import { setConfigValue } from './config'

jest.mock('vscode')

const mockedWorkspace = mocked(workspace)
const mockedUpdate = jest.fn()
const mockedGetConfiguration = jest.fn()
mockedWorkspace.getConfiguration = mockedGetConfiguration

beforeEach(() => {
  jest.resetAllMocks()
  mockedGetConfiguration.mockReturnValueOnce({ update: mockedUpdate })
})

describe('setConfigValue', () => {
  it('should call update with false', () => {
    setConfigValue('fun', false)
    expect(mockedUpdate).toBeCalledWith('fun', false)
  })

  it('should call update with null', () => {
    setConfigValue('fun', null)
    expect(mockedUpdate).toBeCalledWith('fun', null)
  })

  it('should call update with 0', () => {
    setConfigValue('fun', 0)
    expect(mockedUpdate).toBeCalledWith('fun', 0)
  })

  it('should call update with null in place of empty string', () => {
    setConfigValue('fun', '')
    expect(mockedUpdate).toBeCalledWith('fun', null)
  })

  it('should call update with null in place of undefined', () => {
    setConfigValue('fun', undefined)
    expect(mockedUpdate).toBeCalledWith('fun', null)
  })
})
