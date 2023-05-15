import React, { PropsWithChildren } from 'react'
import { STUDIO_URL, SetupSection } from 'dvc/src/setup/webview/contract'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import styles from './styles.module.scss'

const sectionDescriptionTestIds = {
  // "Custom"
  [PlotsSection.CUSTOM_PLOTS]: 'tooltip-custom-plots',
  // "Images"
  [PlotsSection.COMPARISON_TABLE]: 'tooltip-comparison-plots',
  // "Data Series"
  [PlotsSection.TEMPLATE_PLOTS]: 'tooltip-template-plots',
  // Setup DVC
  [SetupSection.DVC]: 'tooltip-setup-dvc',
  // Setup Experiments
  [SetupSection.EXPERIMENTS]: 'tooltip-setup-experiments',
  // Setup Studio
  [SetupSection.STUDIO]: 'tooltip-setup-studio'
}

export const SectionDescriptionMainText = {
  // "Custom"
  [PlotsSection.CUSTOM_PLOTS]: (
    <>
      Generated custom linear plots comparing chosen metrics and params in all
      experiments in the table.
    </>
  ),
  // "Images"
  [PlotsSection.COMPARISON_TABLE]: (
    <>
      Images (e.g. any <code>.jpg</code>, <code>.svg</code>, or
      <code>.png</code> file) rendered side by side across experiments. They
      should be registered as{' '}
      <a href="https://dvc.org/doc/user-guide/experiment-management/visualizing-plots">
        plots
      </a>
      .
    </>
  ),
  // "Data Series"
  [PlotsSection.TEMPLATE_PLOTS]: (
    <>
      Any <code>JSON</code>, <code>YAML</code>, <code>CSV</code>, or{' '}
      <code>TSV</code> file(s) with data points, visualized using{' '}
      <a href="https://dvc.org/doc/user-guide/experiment-management/visualizing-plots#plot-templates-data-series-only">
        plot templates
      </a>
      . Either predefined (e.g. confusion matrix, linear) or{' '}
      <a href="https://dvc.org/doc/command-reference/plots/templates#custom-templates">
        custom Vega-lite templates
      </a>
      .
    </>
  ),
  // Setup DVC
  [SetupSection.DVC]: <>Configure the extension to start working with DVC.</>,
  // Setup Experiments
  [SetupSection.EXPERIMENTS]: (
    <>
      Configure the extension to start tracking and visualizing{' '}
      <a href="https://dvc.org/doc/start/experiment-management/experiments">
        experiments
      </a>
      .
    </>
  ),
  // Setup Studio
  [SetupSection.STUDIO]: (
    <>
      {"Configure the extension's connection to "}
      <a href={STUDIO_URL}>Studio</a>.<br />
      Studio provides a collaboration platform for Machine Learning and is free
      for small teams and individual contributors.
    </>
  )
} as const

export const SectionDescription: React.FC<
  PropsWithChildren<{
    sectionKey: SetupSection | PlotsSection
  }>
> = ({ sectionKey, children }) => (
  <span data-testid={sectionDescriptionTestIds[sectionKey]}>
    {SectionDescriptionMainText[sectionKey]}
    {children && (
      <span className={styles.infoTooltipSecondaryText}>{children}</span>
    )}
  </span>
)
