import * as React from 'react'

function SvgCopy(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 14 14"
      className="copy_svg__tw-inline-block copy_svg__tw-flex-shrink-0 copy_svg__tw-pointer-events-none"
      {...props}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M9.83 5.38H6.6c-.67 0-1.22.55-1.22 1.22v3.23c0 .67.55 1.2 1.22 1.2h3.23c.67 0 1.2-.53 1.2-1.2V6.6c0-.67-.53-1.22-1.2-1.22zM6.6 4.18A2.42 2.42 0 004.17 6.6v3.23a2.42 2.42 0 002.43 2.42h3.23a2.42 2.42 0 002.42-2.42V6.6a2.42 2.42 0 00-2.42-2.43H6.6z"
        clipRule="evenodd"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M4.15 2.95h3.2c.36 0 .68.16.9.4h1.38a2.4 2.4 0 00-2.27-1.6h-3.2a2.4 2.4 0 00-2.41 2.4v3.2a2.4 2.4 0 001.6 2.28V8.25a1.2 1.2 0 01-.4-.9v-3.2c0-.66.54-1.2 1.2-1.2z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default SvgCopy
