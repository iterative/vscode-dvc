import type { StoryFn, Meta } from '@storybook/react'
import React from 'react'

import { IconWrapper } from './components/IconWrapper'
import { IconsWrapper } from './components/IconsWrapper'
import { DISABLE_CHROMATIC_SNAPSHOTS } from './util'
import { Icon } from '../shared/components/Icon'
import {
  Add,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Close,
  Copy,
  ArrowDown,
  Ellipsis,
  Error,
  Filter,
  GitCommit,
  GitMerge,
  GraphLine,
  GraphScatter,
  Gripper,
  ListFilter,
  PassFilled,
  Pinned,
  Refresh,
  SortPrecedence,
  StarEmpty,
  StarFull,
  Trash,
  ArrowUp
} from '../shared/components/icons'

export default {
  args: {
    data: {}
  },
  component: Icon,
  parameters: DISABLE_CHROMATIC_SNAPSHOTS,
  title: 'Icons'
} as Meta

const Template: StoryFn = () => {
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
      <IconWrapper name="Ellipsis">
        <Icon icon={Ellipsis} />
      </IconWrapper>
      <IconWrapper name="ArrowDown">
        <Icon icon={ArrowDown} />
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
      <IconWrapper name="GitMerge">
        <Icon icon={GitMerge} />
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
      <IconWrapper name="ListFilter">
        <Icon icon={ListFilter} />
      </IconWrapper>
      <IconWrapper name="PassFilled">
        <Icon icon={PassFilled} />
      </IconWrapper>
      <IconWrapper name="Pinned">
        <Icon icon={Pinned} />
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
      <IconWrapper name="ArrowUp">
        <Icon icon={ArrowUp} />
      </IconWrapper>
    </IconsWrapper>
  )
}

export const AllIcons = Template.bind({})
