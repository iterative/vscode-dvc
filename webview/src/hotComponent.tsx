import { observer } from 'mobx-react'
import * as React from 'react'
import { observable, runInAction } from 'mobx'
import Module = require('module')

type ReactComponent<P = Record<string, unknown>> =
  | React.ComponentClass<P>
  | React.FunctionComponent<P>

const allComponents = new Map<string, { component: ReactComponent }>()

function getObservableFromComponents<T extends ReactComponent>(
  key: string,
  component: T
) {
  const result = allComponents.get(key)

  setTimeout(() => {
    runInAction(() => {
      if (result) {
        result.component = component
      }
    })
  }, 0)

  return result
}

function createObservableFromComponent<T extends ReactComponent>(
  key: string,
  component: T
) {
  const result = observable({ component })
  allComponents.set(key, result)
  return result
}

function getObservable<T extends ReactComponent>(key: string, component: T) {
  if (allComponents.get(key)) {
    return getObservableFromComponents(key, component)
  } else {
    return createObservableFromComponent(key, component)
  }
}

export function hotComponent(
  module: Module
): <T extends ReactComponent>(Component: T) => T {
  return <T extends ReactComponent>(component: T): T => {
    const key = JSON.stringify({ id: module.id, name: component.name })

    const observable = getObservable<T>(key, component)

    const m = module as {
      hot?: {
        accept: ((componentName: string, callback: () => void) => void) &
          ((callback: () => void) => void)
      }
    }

    if (m.hot) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      m.hot.accept(() => {})
    }

    return observer((props: Record<string, unknown>) => {
      const C = observable ? observable.component : React.Fragment
      return <C {...props} />
    }) as T
  }
}
