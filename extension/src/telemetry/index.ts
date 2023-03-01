// eslint-disable-next-line import/default
import TelemetryReporter from '@vscode/extension-telemetry'
import {
  APPLICATION_INSIGHTS_KEY,
  IEventNamePropertyMapping,
  ViewOpenedEventName
} from './constants'
import { getUserId } from './uuid'
import { Logger } from '../common/logger'

const isTestExecution = (): boolean =>
  !!process.env.VSC_TEST || process.env.NODE_ENV === 'test'
const isDebugSession = (): boolean => !!process.env.VSC_DEBUG

let telemetryReporter: TelemetryReporter | undefined
export const getTelemetryReporter = (): TelemetryReporter => {
  if (!isTestExecution() && !isDebugSession() && telemetryReporter) {
    return telemetryReporter
  }

  telemetryReporter = new TelemetryReporter(APPLICATION_INSIGHTS_KEY)
  return telemetryReporter
}

type EventName = keyof IEventNamePropertyMapping

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
      `Failed to serialize ${key} for ${String(eventName)}: ${JSON.stringify(
        error
      )}`
    )
  }
}

const sanitizeProperties = (
  eventName: EventName,
  data: IEventNamePropertyMapping[EventName]
) => {
  const sanitizedProperties: Record<string, string> = {}
  for (const [key, value] of Object.entries(data || {})) {
    if (value === undefined || value === null) {
      continue
    }
    sanitizeProperty(
      eventName,
      sanitizedProperties,
      key,
      value as string | number | boolean
    )
  }
  return sanitizedProperties
}

export const sendTelemetryEvent = (
  eventName: EventName,
  properties: IEventNamePropertyMapping[EventName],
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
    { ...sanitizedProperties, user_id: getUserId() },
    measurements
  )
}

export const sendErrorTelemetryEvent = (
  eventName: EventName,
  e: Error,
  duration: number,
  properties = {} as IEventNamePropertyMapping[EventName]
) =>
  sendTelemetryEvent(
    `errors.${String(eventName)}` as EventName,
    {
      ...properties,
      error: e.message
    } as unknown as IEventNamePropertyMapping[EventName],
    {
      duration
    }
  )

export const sendTelemetryEventAndThrow = (
  eventName: EventName,
  e: Error,
  duration: number,
  properties = {} as IEventNamePropertyMapping[EventName]
) => {
  sendErrorTelemetryEvent(eventName, e, duration, properties)
  throw e
}

export const sendViewOpenedTelemetryEvent = (
  eventName: ViewOpenedEventName,
  dvcRootCount: number
) => sendTelemetryEvent(eventName, { dvcRootCount }, undefined)
