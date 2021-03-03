import { observable, runInAction } from 'mobx'
import { observer } from 'mobx-react'
import React, { PropsWithChildren } from 'react'

import Module = require('module')

type ReactComponent<P = any> =
  | React.ComponentClass<P>
  | React.FunctionComponent<P>

const allComponents = new Map<string, { component: ReactComponent }>()

export const hotComponent: <P = any>(
  module: Module
) => (
  component: ReactComponent
) => (props: PropsWithChildren<P>) => JSX.Element = module => component => {
  const key = JSON.stringify({ id: module.id, name: component.name })

  let result = allComponents.get(key)
  if (!result) {
    result = observable({ component })
    allComponents.set(key, result)
  } else {
    setTimeout(() => {
      runInAction(() => {
        if (result) result.component = component
      })
    }, 0)
  }

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

  return observer(props => {
    const C = result ? result.component : React.Fragment
    return <C {...props} />
  })
}
