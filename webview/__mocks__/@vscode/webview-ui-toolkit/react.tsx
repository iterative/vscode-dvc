/* eslint-disable unicorn/filename-case */
import React, { PropsWithChildren } from 'react'

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

export const VSCodeProgressRing: React.FC = () => {
  return <div />
}

const MockComponentWithChildren: React.FC<PropsWithChildren> = ({
  children
}) => <div>{children}</div>

export const VSCodePanels = MockComponentWithChildren
export const VSCodePanelTab = MockComponentWithChildren
export const VSCodePanelView = MockComponentWithChildren
export const VSCodeTag = MockComponentWithChildren
