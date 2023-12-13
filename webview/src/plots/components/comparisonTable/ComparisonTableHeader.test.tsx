import React from 'react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  ComparisonTableHeader,
  ComparisonTableHeaderProps
} from './ComparisonTableHeader'

import { plotsReducers } from '../../store'

describe('ComparisonTableHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const basicProps: ComparisonTableHeaderProps = {
    displayColor: '#ffffff',
    id: 'id',
    onClicked: jest.fn(),
    order: [],
    pinnedColumn: undefined,
    setOrder: jest.fn()
  }
  const headerContent = 'ComparisonTableHeader'
  const fullProps = { ...basicProps, children: headerContent }
  const store = configureStore({
    reducer: plotsReducers
  })
  const renderHeader = (props = fullProps) =>
    render(
      <Provider store={store}>
        <ComparisonTableHeader {...props} />
      </Provider>
    )

  it('should render a table header', () => {
    renderHeader()

    const header = screen.getByText(headerContent)

    expect(header).toBeInTheDocument()
  })

  it('should call the pass onClicked prop when clicking the header pin', () => {
    const onClickedSpy = jest.fn()
    renderHeader({ ...fullProps, onClicked: onClickedSpy })

    const headerPin = screen.getByRole('button')

    fireEvent.click(headerPin, {
      bubbles: true,
      cancelable: true
    })

    expect(onClickedSpy).toHaveBeenCalledTimes(1)
  })
})
