import { Story, Meta } from '@storybook/react/types-6-0'
import React from 'react'

import './test-vscode-styles.scss'
import '../shared/style.scss'
import { IconWrapper } from './components/IconWrapper'
import { IconsWrapper } from './components/IconsWrapper'
import { Icon } from '../shared/components/Icon'
import {
  Add,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Close,
  Copy,
  Dots,
  DownArrow,
  Ellipsis,
  Error,
  Filter,
  GitCommit,
  GraphLine,
  GraphScatter,
  Gripper,
  Lines,
  Pin,
  Refresh,
  SortPrecedence,
  StarEmpty,
  StarFull,
  Trash,
  UpArrow
} from '../shared/components/icons'

export default {
  args: {
    data: {}
  },
  component: Icon,
  title: 'Icons'
} as Meta

const Template: Story = () => {
  return (
    <IconsWrapper>
      <IconWrapper name="Add">
        <Icon icon={Add} />
      </IconWrapper>
      <IconWrapper name="Check">
        <Icon icon={Check} />
      </IconWrapper>
      <IconWrapper name="ChevronDown">
        <Icon icon={ChevronDown} />
      </IconWrapper>
      <IconWrapper name="ChevronRight">
        <Icon icon={ChevronRight} />
      </IconWrapper>
      <IconWrapper name="Clock">
        <Icon icon={Clock} />
      </IconWrapper>
      <IconWrapper name="Close">
        <Icon icon={Close} />
      </IconWrapper>
      <IconWrapper name="Copy">
        <Icon icon={Copy} />
      </IconWrapper>
      <IconWrapper name="Dots">
        <Icon icon={Dots} />
      </IconWrapper>
      <IconWrapper name="DownArrow">
        <Icon icon={DownArrow} />
      </IconWrapper>
      <IconWrapper name="Ellipsis">
        <Icon icon={Ellipsis} />
      </IconWrapper>
      <IconWrapper name="Error">
        <Icon icon={Error} />
      </IconWrapper>
      <IconWrapper name="Filter">
        <Icon icon={Filter} />
      </IconWrapper>
      <IconWrapper name="GitCommit">
        <Icon icon={GitCommit} />
      </IconWrapper>
      <IconWrapper name="GraphLine">
        <Icon icon={GraphLine} />
      </IconWrapper>
      <IconWrapper name="GraphScatter">
        <Icon icon={GraphScatter} />
      </IconWrapper>
      <IconWrapper name="Gripper">
        <Icon icon={Gripper} />
      </IconWrapper>
      <IconWrapper name="Lines">
        <Icon icon={Lines} />
      </IconWrapper>
      <IconWrapper name="Pin">
        <Icon icon={Pin} />
      </IconWrapper>
      <IconWrapper name="Refresh">
        <Icon icon={Refresh} />
      </IconWrapper>
      <IconWrapper name="SortPrecedence">
        <Icon icon={SortPrecedence} />
      </IconWrapper>
      <IconWrapper name="StarEmpty">
        <Icon icon={StarEmpty} />
      </IconWrapper>
      <IconWrapper name="StarFull">
        <Icon icon={StarFull} />
      </IconWrapper>
      <IconWrapper name="Trash">
        <Icon icon={Trash} />
      </IconWrapper>
      <IconWrapper name="UpArrow">
        <Icon icon={UpArrow} />
      </IconWrapper>
    </IconsWrapper>
  )
}

export const AllIcons = Template.bind({})
