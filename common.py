from os import getcwd
from pathlib import Path
from platform import system
from subprocess import run

_envFolderName = 'venv'

def getEnvPath():
	return Path.cwd() / _envFolderName

def _getEnvScriptsPath():
	rtn = None
	sys = system()

	dirName = None
	if sys == 'Windows':
		dirName = 'Scripts'
	elif sys == 'Linux':
		dirName = 'bin'
	else:
		raise RuntimeError('Unsupported operating system type')

	rtn = getEnvPath() / dirName

	if not rtn.exists():
		raise RuntimeError('Env Scripts folder not in cwd')

	return rtn

def _run(scriptsExeName, args):
	rtn = None
	scriptsPath = getEnvPath()
	path = scriptsPath / scriptsExeName
	if path.is_file():
		cmd = [path].extend(args.split(' '))
		rtn = run(cmd)
		if rtn.returncode != 0:
			raise RuntimeError('{0} exited with error'.format(scriptsExeName))
	else:
		raise RuntimeError('{0} not found'.format(scriptsExeName))
	return rtn


def runPython(args):
	_run('python.exe', args)

def runPip(args):
	_run('pip.exe', args)
