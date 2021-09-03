import { mocked } from 'ts-jest/utils'
import { extensions } from 'vscode'
import TelemetryReporter from 'vscode-extension-telemetry'
import { getTelemetryReporter, sendTelemetryEvent } from '.'
import {
  APPLICATION_INSIGHTS_KEY,
  EXTENSION_ID,
  IEventNamePropertyMapping
} from './constants'

const mockedTelemetryReporter = mocked(TelemetryReporter)

const mockedExtensions = mocked(extensions)
const mockedGetExtension = jest.fn()
mockedExtensions.getExtension = mockedGetExtension
const mockedPackageJSON = {
  id: EXTENSION_ID,
  name: 'dvc',
  version: '0.1.0'
}
const mockedSendTelemetryEvent = jest.fn()

jest.mock('vscode-extension-telemetry')
jest.mock('vscode')

beforeEach(() => {
  jest.resetAllMocks()
  mockedTelemetryReporter.mockImplementation(function () {
    return {
      sendTelemetryEvent: mockedSendTelemetryEvent
    } as unknown as TelemetryReporter
  })
})

describe('getTelemetryReporter', () => {
  process.env.NODE_ENV = 'prod'
  let telemetryReporter: TelemetryReporter | undefined

  it('should create a reporter on the first call', () => {
    mockedGetExtension.mockReturnValueOnce({
      packageJSON: mockedPackageJSON
    })
    telemetryReporter = getTelemetryReporter()

    expect(telemetryReporter).toBeDefined()
    expect(mockedGetExtension).toBeCalledTimes(1)
    expect(mockedGetExtension).toBeCalledWith('iterative.dvc')
    expect(mockedTelemetryReporter).toBeCalledTimes(1)
    expect(mockedTelemetryReporter).toBeCalledWith(
      EXTENSION_ID,
      mockedPackageJSON.version,
      APPLICATION_INSIGHTS_KEY,
      true
    )
    process.env.NODE_ENV = 'test'
  })

  it('should return the reporter on all subsequent calls', () => {
    process.env.NODE_ENV = 'prod'
    const sameTelemetryReporter = getTelemetryReporter()

    expect(telemetryReporter).toEqual(sameTelemetryReporter)
    expect(mockedTelemetryReporter).not.toBeCalled()
    expect(mockedGetExtension).not.toBeCalled()
    process.env.NODE_ENV = 'test'
  })
})

describe('sendTelemetryEvent', () => {
  it('should call the reporter with the correct event name and sanitized parameters', () => {
    process.env.NODE_ENV = 'prod'
    const mockedEventName = 'mockedEvent' as keyof IEventNamePropertyMapping
    const mockedEventProperties = {
      a: 1,
      b: { c: 2, d: { e: '3' } },
      f: null,
      g: undefined,
      h: 'some string',
      i: true
    } as unknown as IEventNamePropertyMapping[keyof IEventNamePropertyMapping]
    const mockedMeasurements = {
      duration: 1000
    }

    sendTelemetryEvent(
      mockedEventName,
      mockedEventProperties,
      mockedMeasurements
    )

    expect(mockedSendTelemetryEvent).toBeCalledWith(
      mockedEventName,
      {
        a: '1',
        b: '{"c":2,"d":{"e":"3"}}',
        h: 'some string',
        i: 'true'
      },
      mockedMeasurements
    )
    process.env.NODE_ENV = 'test'
  })
})
