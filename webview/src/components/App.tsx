import * as React from 'react'
import { hotComponent } from '../hotComponent'
import { GUI } from './GUI'
import { Model } from '../model/Model'

@hotComponent(module)
export class App extends React.Component {
  private readonly model = new Model()

  constructor(props: any) {
    super(props)
  }

  render() {
    return <GUI model={this.model} />
  }
}
