import TelemetryReporter from 'vscode-extension-telemetry'
import {
  EXTENSION_ID,
  APPLICATION_INSIGHTS_KEY,
  IEventNamePropertyMapping,
  TreeOpenedEventName
} from './constants'
import { Logger } from '../common/logger'
import { getExtensionVersion } from '../vscode/extensions'

const isTestExecution = (): boolean =>
  !!process.env.VSC_TEST || process.env.NODE_ENV === 'test'
const isDebugSession = (): boolean => !!process.env.VSC_DEBUG

let telemetryReporter: TelemetryReporter | undefined
export const getTelemetryReporter = (): TelemetryReporter => {
  if (!isTestExecution() && !isDebugSession() && telemetryReporter) {
    return telemetryReporter
  }

  const version = getExtensionVersion(EXTENSION_ID) || 'unknown'

  telemetryReporter = new TelemetryReporter(
    EXTENSION_ID,
    version,
    APPLICATION_INSIGHTS_KEY,
    true
  )
  return telemetryReporter
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
  properties: P[E],
  measurements: { [key: string]: number } | undefined
) => {
  if (isTestExecution() || isDebugSession()) {
    return
  }
  const reporter = getTelemetryReporter()
  const sanitizedProperties = properties
    ? sanitizeProperties(eventName, properties)
    : undefined
  reporter.sendTelemetryEvent(
    eventName as string,
    sanitizedProperties,
    measurements
  )
}

export const sendTreeOpenedEvent = (
  eventName: TreeOpenedEventName,
  dvcRootCount: number
) => sendTelemetryEvent(eventName, { dvcRootCount }, undefined)
