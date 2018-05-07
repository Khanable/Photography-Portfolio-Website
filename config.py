from pathlib import PurePosixPath

serverRoot = PurePosixPath('./server/')
clientRoot = PurePosixPath('./client/')
serverPackagesName = 'packages.py'

#Use ./ instead of ~/ as sftp will not cd otherwise
serverRemoteRoot = PurePosixPath('./servers/elouise.mentalsnail.com.au/')
clientRemoteRoot = PurePosixPath('./elouise.mentalsnail.com.au/')

serverSFTPBatchName = 'deploy'

serverHostName = 'sgss4.a2hosting.com'
serverPort = '7822'
serverPrivateKeyPath = PurePosixPath('~/.ssh/sgss4.a2hosting.com')
serverUserName = 'mentalsn'

serverRemotePackagesName = 'packages.py'
serverScriptsConfigName = 'serverConfig.py'

serverDevEntryName = 'dev.py'

serverSrcDir = 'src'
serverApplicationScriptsDir = 'scripts'

serverBuildConfigName = 'config.py'
serverDevConfigName = 'configDevelopment.py'
serverProductionConfigName = 'configProduction.py'
serverBuildIgnoreRe = ['\.git', '\.pyc', '\.swp']
serverDevDBName = 'test.db'

serverRemoteBuildDir = 'build'
serverDevBuildDir = '__devBuild__'
serverProductionBuildDir = '__productionBuild__'
serverVirtualEnvScriptsDir = 'bin'

clientProductionBuildDir = 'dist'
clientProductionBaseHref = '/rebate/'
