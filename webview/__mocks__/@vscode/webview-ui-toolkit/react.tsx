/* eslint-disable unicorn/filename-case */
import React from 'react'

type MockButtonProps = {
  onClick: () => void
  children: React.ReactNode
}

export const VSCodeButton: React.FC<MockButtonProps> = ({
  onClick,
  children
}: MockButtonProps) => {
  return <button onClick={onClick}>{children}</button>
}

export const VSCodeDivider: React.FC = () => {
  return <hr />
}

type MockCheckboxProps = {
  onClick: () => void
}

export const VSCodeCheckbox: React.FC<MockCheckboxProps> = ({ onClick }) => {
  return <input type="checkbox" onClick={onClick} />
}
