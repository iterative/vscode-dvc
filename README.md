# VSCode DVC: Insider Preview

[![Continuous Integration](https://github.com/iterative/vscode-dvc/actions/workflows/continuous-integration.yml/badge.svg)](https://github.com/iterative/vscode-dvc/actions/workflows/continuous-integration.yml)
[![Cross-Platform Test](https://github.com/iterative/vscode-dvc/actions/workflows/cross-platform-test.yml/badge.svg)](https://github.com/iterative/vscode-dvc/actions/workflows/cross-platform-test.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/fb243c31ea059c0038b2/maintainability)](https://codeclimate.com/repos/608b5886f52398018b00264c/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/fb243c31ea059c0038b2/test_coverage)](https://codeclimate.com/repos/608b5886f52398018b00264c/test_coverage)

A [Visual Studio Code](https://code.visualstudio.com/)
[extension](https://marketplace.visualstudio.com/VSCode) that aims to allow
users of all technical backgrounds to effectively use [DVC](https://dvc.org/).

## Installing the Extension

This project is currently in closed alpha testing, and constantly evolving.
After we conclude alpha and beta testing the repository will become public and
we will be publishing the extension to the marketplace.

### In the meantime...

This repository is set up with a
[GitHub Action](https://github.com/iterative/vscode-dvc/actions) that uploads an
installable vsix build of the extension for every commit, complete with the Git
SHA appended to the extension version.

You can find the download link in the artifacts list of any run of the
[Continuous Integration workflow](https://github.com/iterative/vscode-dvc/actions/workflows/continuous-integration.yml?query=branch%3Amaster+is%3Acompleted).
Click on the desired run and the artifact will be displayed as in the following
screenshot:

![Screenshot of artifacts menu](https://user-images.githubusercontent.com/9111807/118053924-64d0e000-b353-11eb-8d3d-7e202d741f54.png)

It is recommended that you take the artifact from the most recent run.

Once you have downloaded and extracted the `vsix` file, you can install it
following the
[official documentation](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix).

## Quick start

- **Step 1.**
  [Install a supported version of DVC on your system](https://dvc.org/doc/install)
- **Step 2.**
  [Install the DVC extension for Visual Studio Code](https://code.visualstudio.com/docs/editor/extension-gallery).
- **Step 3.** See walkthrough.

**Note:** Our walkthrough will automatically be shown after installation. If for
any reason you need to revisit the walkthrough it can be accessed via
`DVC: Get Started` from the command palette.

## Features

- [Command Palette](extension/resources/walkthrough/command-palette.md)
- [Source Control Management](extension/resources/walkthrough/source-control-management.md)
- [Tracked Resources](extension/resources/walkthrough/tracked-explorer.md)
- [DVC View Container](extension/resources/walkthrough/view-container.md)
- [Experiments Table](extension/resources/walkthrough/experiments-table.md)
- Plots

### Debugging

Due to the way DVC pipelines run scripts of any language from the command line,
users must debug pipeline scripts (e.g. `train.py`) standalone in whatever way
debuggers are run on the base language - this is standard for debugging DVC
pipelines, and most scripts are capable of running outside of DVC.

## Contributing

See development docs and contributing guidelines in
[CONTRIBUTING.md](CONTRIBUTING.md)

## Data and telemetry

The DVC Extension for Visual Studio Code collects usage data and sends it to
Azure to help improve our products and services. This extension respects the
`telemetry.enableTelemetry` setting which you can learn more about at
https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting.
