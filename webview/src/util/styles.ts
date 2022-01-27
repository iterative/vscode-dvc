import { DetailedHTMLProps, HTMLAttributes } from 'react'

export const withScale = (scale: number) =>
  ({ '--scale': scale } as DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >)
