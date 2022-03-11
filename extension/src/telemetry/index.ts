import TelemetryReporter from 'vscode-extension-telemetry'
import {
  EXTENSION_ID,
  APPLICATION_INSIGHTS_KEY,
  IEventNamePropertyMapping,
  ViewOpenedEventName
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

const sanitizeProperty = (
  eventName: string,
  sanitizedProperties: Record<string, string>,
  key: string,
  value: object | string | number | boolean
) => {
  try {
    // If there are any errors in serializing one property, ignore that and move on.
    // Else nothing will be sent.
    sanitizedProperties[key] = convertProperty(value)
  } catch (error: unknown) {
    Logger.error(
      `Failed to serialize ${key} for ${String(eventName)}: ${error}`
    )
  }
}

const sanitizeProperties = <
  P extends IEventNamePropertyMapping,
  E extends keyof P
>(
  eventName: E,
  data: P[E]
) => {
  const sanitizedProperties: Record<string, string> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      continue
    }
    sanitizeProperty(eventName as string, sanitizedProperties, key, value)
  }
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

export const sendErrorTelemetryEvent = <
  P extends IEventNamePropertyMapping,
  E extends keyof P
>(
  eventName: E,
  e: Error,
  duration: number,
  properties = {} as P[E]
) =>
  sendTelemetryEvent(
    `errors.${eventName}` as E,
    { ...properties, error: e.message } as P[E],
    {
      duration
    }
  )

export const sendTelemetryEventAndThrow = <
  P extends IEventNamePropertyMapping,
  E extends keyof P
>(
  eventName: E,
  e: Error,
  duration: number,
  properties = {} as P[E]
) => {
  sendErrorTelemetryEvent(eventName, e, duration, properties)
  throw e
}

export const sendViewOpenedTelemetryEvent = (
  eventName: ViewOpenedEventName,
  dvcRootCount: number
) => sendTelemetryEvent(eventName, { dvcRootCount }, undefined)
