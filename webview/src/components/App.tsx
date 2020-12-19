import * as React from 'react'
import { hotComponent } from '../hotComponent'
import { GUI } from './GUI'
import { getModel } from '../model/Model'

@hotComponent(module)
export class App extends React.Component {
  private readonly model = getModel()

  render(): JSX.Element {
    return <GUI model={this.model} />
  }
}
