# VSCode DVC: Insider Preview

[![Continuous Integration](https://github.com/iterative/vscode-dvc/actions/workflows/build.yml/badge.svg)](https://github.com/iterative/vscode-dvc/actions/workflows/build.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/fb243c31ea059c0038b2/maintainability)](https://codeclimate.com/repos/608b5886f52398018b00264c/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/fb243c31ea059c0038b2/test_coverage)](https://codeclimate.com/repos/608b5886f52398018b00264c/test_coverage)

A Visual Studio Code Extension that aims to allow users of all technical
backgrounds to effectively use [DVC](https://dvc.org/), particularly the new
[Experiments](https://dvc.org/doc/start/experiments) feature.

This project is in a very early state, and will definitely change in the future.

## Setup

### Installing the Extension

This repo is set up with a
[GitHub Action](https://github.com/iterative/vscode-dvc/actions) that uploads an
installable vsix build of the extension for every commit, complete with the Git
SHA appended to the extension version.

You can find the download link in the Artifacts list of any run of the
Continuous Integration workflow.

![Screenshot of artifacts menu](https://user-images.githubusercontent.com/9111807/118053924-64d0e000-b353-11eb-8d3d-7e202d741f54.png)

The easiest way to get to the build for any particular branch is to use the
GitHub Checks UI to get to the details of the "Continuous Integration" run: next
to any commit, its CI status will show up as an icon next to it. From there, you
can get to that commit's vsix in a few clicks through the Continuous Integration
check's details and to the summary of the Check run:

![Guide to get from Checks status to Artifacts](https://user-images.githubusercontent.com/9111807/118057990-19bacb00-b35b-11eb-9030-558e802668f1.png)

Once you have downloaded and extracted the `vsix` file, you can install it
following the
[official documentation](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix).

### Installing and Integrating With DVC CLI

There are quite a few options for installing DVC, with one big split being
whether DVC is installed globally or in a virtual environment. This extension
allows for a few different methods for picking how to run DVC.

- Virtual environment recognition powered by the
  [`ms-python`](https://marketplace.visualstudio.com/items?itemName=ms-python.python)
  extension.

- The `dvc.dvcPath` setting can be set to a specific binary path in order to use
  a specific dvc executable and skip all `ms-python` inference.

- Simply calling `dvc` on the CLI is used as a fallback.

Using the Python extension is the easiest way to use virtual environments, and
using a global install of dvc is the easiest way to not use the Python
extension. For other niche cases, the `dvc.dvcPath` setting should hopefully
serve as an escape hatch.

The "Select DVC CLI Path" command in the Command Palette can be used to set the
`dvc.dvcPath` option from a more user-friendly QuickPick menu.

## How to Use

This extension, especially in this early state, makes extensive use of the
[Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette).
Every feature should be available from the Command Palette, and from there
additional GUI elements are added for convenience.

### Experiments

To open up the Experiments table view for a DVC repo, use the "Show Experiments"
command from the Command Palette.

To run experiments, use the "Run Experiment" command or use the UI elements
available when the table is visible.

![Experiment GUI Buttons](https://user-images.githubusercontent.com/9111807/118054967-40760300-b355-11eb-8ee6-38a344bdaced.png)

### SCM

The extension also provides a view in the SCM view container, next to the Git
view, to manage file actions like checkout, pull, push, and add.

![SCM view screenshot](https://user-images.githubusercontent.com/9111807/118057076-19b9cb80-b359-11eb-91bc-9c73a85a83a8.png)

## Contributing

See development docs and contributing guidelines in
[CONTRIBUTING.md](CONTRIBUTING.md)
