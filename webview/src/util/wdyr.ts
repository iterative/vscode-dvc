/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { ReactElement } from 'react'
import { Obj } from './objects'

type WDYRNotifierInfo = {
  Component: React.Component
  displayName: string
  hookName: string
  prevProps: Obj
  prevState: Obj
  prevHook: string
  nextProps: Obj
  nextState: Obj
  nextHook: string
  reason: string
  options: Obj
  ownerDataMap: Obj
}
type WDYROptions = {
  include?: RegExp[]
  exclude?: RegExp[]
  trackAllPureComponents?: boolean
  trackHooks?: boolean
  trackExtraHooks?: any[] // https://github.com/welldone-software/why-did-you-render#trackextrahooks
  logOwnerReasons?: boolean
  logOnDifferentValues?: boolean
  hotReloadBufferMs?: number
  onlyLogs?: boolean
  collapseGroups?: boolean
  titleColor?: string
  diffNameColor?: string
  diffPathColor?: string
  notifier?: (info: WDYRNotifierInfo) => void
  getAdditionalOwnerData?: (element: ReactElement) => void
}
type ComponentWithWDYR = { whyDidYouRender: boolean | WDYROptions }

let trackComponent = (_: React.FC<any>, __?: () => void) => {}
let stopTrackingComponent = (_: React.FC<any>) => {}
let stopTrackingAllComponents = () => {}

if (['development', 'test'].includes(process.env.NODE_ENV || '')) {
  const whyDidYouRender = require('@welldone-software/why-did-you-render')
  const trackedComponents: { [key: string]: React.FC<any> } = {}

  whyDidYouRender(React, {
    trackAllPureComponents: false
  })

  trackComponent = (component: React.FC<any>, callback?: () => void) => {
    ;(component as unknown as ComponentWithWDYR).whyDidYouRender = {
      collapseGroups: true,
      notifier: () => {
        callback?.()
      }
    }
    trackedComponents[component.toString()] = component
  }

  stopTrackingComponent = (component: React.FC<any>) => {
    ;(component as unknown as ComponentWithWDYR).whyDidYouRender = false
  }

  stopTrackingAllComponents = () => {
    for (const component of Object.values(trackedComponents)) {
      stopTrackingComponent(component)
      delete trackedComponents[component.toString()]
    }
  }
}

export const trackComponentRenders = trackComponent
export const stopTrackingComponentRenders = stopTrackingComponent
export const stopTrackingAllComponentsRenders = stopTrackingAllComponents
