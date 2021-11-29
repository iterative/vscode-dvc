import * as React from 'react'

function SvgClock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14 8A6 6 0 112 8a6 6 0 0112 0zm1 0A7 7 0 111 8a7 7 0 0114 0zM7 4v5.5h3v-1H8V4H7z"
        fill="currentColor"
      />
    </svg>
  )
}

export default SvgClock
