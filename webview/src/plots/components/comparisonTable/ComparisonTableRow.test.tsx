/**
 * @jest-environment jsdom
 */
import { configureStore } from '@reduxjs/toolkit'
import { join } from 'dvc/src/test/util/path'
import React from 'react'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import comparisonPlotsFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import { Provider } from 'react-redux'
import {
  ComparisonTableRow,
  ComparisonTableRowProps
} from './ComparisonTableRow'
import styles from '../styles.module.scss'
import { plotsReducers } from '../../store'
import {
  clearSelection,
  createWindowTextSelection
} from '../../../test/selection'

jest.mock('../../../shared/api')

describe('ComparisonTableRow', () => {
  afterEach(() => {
    cleanup()
  })

  const basicProps: ComparisonTableRowProps = {
    nbColumns: 3,
    path: 'path/to/the-file/image.png',
    pinnedColumn: '',
    plots: Object.values(
      comparisonPlotsFixture.plots.find(
        ({ path }) => path === join('plots', 'acc.png')
      )?.revisions || {}
    )
  }

  const renderRow = (props = basicProps) =>
    render(
      <Provider
        store={configureStore({
          reducer: plotsReducers
        })}
      >
        <table>
          <tbody>
            <ComparisonTableRow {...props} />
          </tbody>
        </table>
      </Provider>
    )

  it('should render a row toggler', () => {
    renderRow()

    const rowToggler = screen.getByText(basicProps.path)

    expect(rowToggler).toBeInTheDocument()
  })

  it('should render as many plots as there are in the props', () => {
    renderRow()
    const plots = screen.getAllByAltText(
      /(Plot of path\/to\/the-file\/image\.png)/
    )

    expect(plots.length).toBe(basicProps.plots.length)
  })

  it('should hide the plots when clicking the row toggler once and show them again on the second click', () => {
    renderRow()

    const rowToggler = screen.getByText(basicProps.path)
    const [row] = screen.getAllByTestId('row-images')

    expect(row).not.toHaveClass(styles.cellHidden)

    fireEvent.click(rowToggler, {
      bubbles: true,
      cancelable: true
    })

    expect(row).toHaveClass(styles.cellHidden)

    fireEvent.click(rowToggler, {
      bubbles: true,
      cancelable: true
    })

    expect(row).not.toHaveClass(styles.cellHidden)
  })

  it('should not toggle the row if the path was selected', () => {
    renderRow()

    const rowToggler = screen.getByText(basicProps.path)
    const [row] = screen.getAllByTestId('row-images')

    createWindowTextSelection(basicProps.path, 5)
    fireEvent.click(rowToggler)

    expect(row).not.toHaveClass(styles.cellHidden)

    clearSelection()
    fireEvent.click(rowToggler)

    expect(row).toHaveClass(styles.cellHidden)

    createWindowTextSelection(basicProps.path, 0)
    fireEvent.click(rowToggler)

    expect(row).not.toHaveClass(styles.cellHidden)
  })

  it('should toggle the row if some other path is selected', () => {
    renderRow()

    const rowToggler = screen.getByText(basicProps.path)
    const [row] = screen.getAllByTestId('row-images')

    createWindowTextSelection('other/path/img.gif', 5)
    fireEvent.click(rowToggler)

    expect(row).toHaveClass(styles.cellHidden)
  })
})
