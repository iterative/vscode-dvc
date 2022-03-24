/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, cleanup, screen } from '@testing-library/react'
import { Theme } from './Theme'

describe('Theme', () => {
  afterEach(() => {
    cleanup()
  })

  it('should add some css variables to the markup', () => {
    render(<Theme />)

    const theme = screen.getByTestId('theme-wrapper')
    const expectedVariables = [
      '--editor-background-transparency-1',
      '--editor-background-transparency-2',
      '--editor-background-transparency-3',
      '--editor-background-transparency-4',
      '--editor-background-transparency-5',
      '--editor-background-transparency-6',
      '--editor-background-transparency-7',
      '--editor-background-transparency-8',
      '--editor-background-transparency-9',
      '--editor-foreground-transparency-1',
      '--editor-foreground-transparency-2',
      '--editor-foreground-transparency-3',
      '--editor-foreground-transparency-4',
      '--editor-foreground-transparency-5',
      '--editor-foreground-transparency-6',
      '--editor-foreground-transparency-7',
      '--editor-foreground-transparency-8',
      '--editor-foreground-transparency-9'
    ]

    for (const variable of expectedVariables) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((theme.style as any)._values[variable]).toStrictEqual(
        expect.any(String)
      )
    }
  })
})
