import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { Provider, useDispatch } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MessageToWebviewType } from 'dvc/src/webview/contract'
import { PlotsData } from 'dvc/src/plots/webview/contract'
import plotsRevisionsFixture from 'dvc/src/test/fixtures/plotsDiff/revisions'
import { Ribbon } from '../plots/components/ribbon/Ribbon'
import './test-vscode-styles.scss'
import '../shared/style.scss'
import '../plots/components/styles.module.scss'
import { plotsReducers } from '../plots/store'
import { feedStore } from '../plots/components/App'

const MockedState: React.FC<{ data: PlotsData; children: React.ReactNode }> = ({
  children,
  data
}) => {
  const dispatch = useDispatch()
  const message = { data, type: MessageToWebviewType.SET_DATA }
  feedStore(message, dispatch)

  return <>{children}</>
}

export default {
  args: {
    data: {
      selectedRevisions: plotsRevisionsFixture
    }
  },
  component: Ribbon,
  title: 'Plots Ribbon'
} as Meta

const Template: Story<{
  data?: PlotsData
}> = ({ data }) => {
  const store = configureStore({ reducer: plotsReducers })
  return (
    <Provider store={store}>
      <MockedState data={data}>
        <Ribbon />
      </MockedState>
    </Provider>
  )
}

export const WithData = Template.bind({})

export const WithLoading = Template.bind({})
WithLoading.args = {
  data: {
    selectedRevisions: plotsRevisionsFixture.map(item => {
      if (['main', '42b8736'].includes(item.revision)) {
        return { ...item, fetched: false }
      }
      return item
    })
  }
}
WithLoading.parameters = { chromatic: { disableSnapshot: true } }
