import TelemetryReporter from 'vscode-extension-telemetry'
import { Logger } from '../common/logger'
import { getThisExtensionDetails } from '../vscode/extensions'

const isTestExecution = (): boolean => !!process.env.VSC_TEST
const isDebugSession = (): boolean => !!process.env.VSC_DEBUG

let telemetryReporter: TelemetryReporter | undefined
export const getTelemetryReporter = (): TelemetryReporter => {
  if (!isTestExecution() && !isDebugSession() && telemetryReporter) {
    return telemetryReporter
  }

  const { aiKey, id, version } = getThisExtensionDetails()

  telemetryReporter = new TelemetryReporter(id, version, aiKey, true)
  return telemetryReporter
}

// placeholder
export enum EventName {
  EXTENSION_LOAD = 'EXTENSION.LOAD'
}

// placeholder
export interface IEventNamePropertyMapping {
  [EventName.EXTENSION_LOAD]: {
    workspaceFolderCount: number
  }
}

const convertProperty = (prop: object | string | number | boolean): string => {
  if (typeof prop === 'string') {
    return prop
  }
  if (typeof prop === 'object') {
    return JSON.stringify(prop)
  }
  return prop.toString()
}

const sanitizeProperties = <
  P extends IEventNamePropertyMapping,
  E extends keyof P
>(
  eventName: E,
  data: P[E]
) => {
  const sanitizedProperties: Record<string, string> = {}
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return
    }
    try {
      // If there are any errors in serializing one property, ignore that and move on.
      // Else nothing will be sent.
      sanitizedProperties[key] = convertProperty(value)
    } catch (e) {
      Logger.error(`Failed to serialize ${key} for ${eventName}: ${e}`)
    }
  })
  return sanitizedProperties
}

export const sendTelemetryEvent = <
  P extends IEventNamePropertyMapping,
  E extends keyof P
>(
  eventName: E,
  properties: P[E]
) => {
  if (isTestExecution() || isDebugSession()) {
    return
  }
  const reporter = getTelemetryReporter()
  const sanitizedProperties = sanitizeProperties(eventName, properties)
  reporter.sendTelemetryEvent(eventName as string, sanitizedProperties)
}
