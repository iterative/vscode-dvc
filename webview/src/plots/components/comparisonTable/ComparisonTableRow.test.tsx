/**
 * @jest-environment jsdom
 */
import { join } from 'dvc/src/test/util/path'
import React from 'react'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import comparisonPlotsFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import {
  ComparisonTableRow,
  ComparisonTableRowProps
} from './ComparisonTableRow'
import styles from '../styles.module.scss'

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
      <table>
        <ComparisonTableRow {...props} />
      </table>
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
    const [plot] = screen.getAllByAltText(
      /(Plot of path\/to\/the-file\/image\.png)/
    )

    /* eslint-disable testing-library/no-node-access */
    expect(plot.parentElement).not.toHaveClass(styles.cellHidden)

    fireEvent.click(rowToggler, {
      bubbles: true,
      cancelable: true
    })

    /* eslint-disable testing-library/no-node-access */
    expect(plot.parentElement).toHaveClass(styles.cellHidden)

    fireEvent.click(rowToggler, {
      bubbles: true,
      cancelable: true
    })

    /* eslint-disable testing-library/no-node-access */
    expect(plot.parentElement).not.toHaveClass(styles.cellHidden)
  })
})
