import * as React from 'react'
import { observer } from 'mobx-react'
import { hotComponent } from '../hotComponent'

import ExperimentsGUI from './Experiments'
import { Model } from '../model/Model'

export const GUI = hotComponent(module)(
  observer(({ model }: { model: Model }) => {
    try {
      const { errors, experiments, vsCodeApi } = model
      return (
        <>
          {errors &&
            errors.map(
              (
                error: React.ReactNode,
                i: string | number | null | undefined
              ) => (
                <div className="error-message" key={i}>
                  {error}
                </div>
              )
            )}
          <ExperimentsGUI experiments={experiments} vsCodeApi={vsCodeApi} />
        </>
      )
    } catch (e) {
      return <p>{e.toString()}</p>
    }
  })
) as React.FC<{ model: Model }>
