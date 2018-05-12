from common import runPython
from os import getcwd
from os.path import join
from pathlib import Path

serverDev = Path.cwd() / 'server'/ 'dev.py'
runPython(serverDev) 
