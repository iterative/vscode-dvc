import { join, resolve } from 'path'
import { setupVenv } from 'dvc/src/python'

const cwd = resolve(__dirname, '..', 'demo')

setupVenv(cwd, '.env', '-r', join('.', 'requirements.txt'))
