import * as React from 'react'

function SvgDownArrow(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 11 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M.152 7.086l4.992 5.008h.704l5.008-5.008-.704-.704-4.144 4.144V.094H5v10.432L.856 6.382l-.704.704z"
        fill="currentColor"
      />
    </svg>
  )
}

export default SvgDownArrow
