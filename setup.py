from common import getEnvPath, runPip
from venv import EnvBuilder

env = EnvBuilder(with_pip=True)
env.create(getEnvPath())

runPip('-r requirements.txt')
