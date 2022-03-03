import * as React from 'react'
import { SVGProps } from 'react'

const SvgPin = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={7}
    height={11}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M1 .4h5.256v.205c0 .304-.068.584-.204.84a1.892 1.892 0 0 1-.552.66v2.148c.232.104.44.24.624.408.184.16.34.344.468.552.136.2.236.42.3.66.072.24.108.484.108.732v.384H4V9.4l-.372.744-.372-.744V6.989h-3v-.384c0-.248.032-.488.096-.72.072-.24.172-.464.3-.672a2.487 2.487 0 0 1 1.092-.96V2.105a1.921 1.921 0 0 1-.552-.66A1.9 1.9 0 0 1 1 .605V.4Zm.816.589a1.046 1.046 0 0 0 .456.552l.228.144v3.084l-.252.084a1.83 1.83 0 0 0-.78.528c-.104.12-.2.28-.288.48-.08.184-.14.364-.18.54h5.256c-.04-.168-.1-.348-.18-.54-.088-.2-.184-.36-.288-.48a1.786 1.786 0 0 0-.78-.528l-.252-.096V1.685l.216-.132a.861.861 0 0 0 .192-.144c.056-.056.108-.116.156-.18a.678.678 0 0 0 .12-.24H1.816Z"
      fill="currentColor"
    />
  </svg>
)

export default SvgPin
