import falcon
from .user import UserStorage
from .rebate import RebateResource, RebateStorage, RebateLogEvents
from .falconAuthentication.authentication import CredentialStorage, SessionStorage, AuthenticationResource, AuthenticationSettingsStorage, AuthenticationLogEvents
from .setting import SettingStorage
from .db import Database
from .util import SetDefaultResponseHeaders
from .logger.log import Logger
from .logSources import LogSources
from .config import dbURI, debug, errorFilePath

db = Database(dbURI, echo=debug)

logger = Logger(errorFilePath, LogSources)
settingStorage = SettingStorage()
authenticationSettingsStorage = AuthenticationSettingsStorage()
sessionStorage = SessionStorage(authenticationSettingsStorage)
userStorage = UserStorage()
rebateStorage = RebateStorage()
credentialStorage = CredentialStorage(authenticationSettingsStorage)

app = application = falcon.API(middleware=SetDefaultResponseHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, Content-Type'
    }))
app.add_route('/rebate',  RebateResource( db, rebateStorage, sessionStorage, logger.newProvider(LogSources.Rebate, RebateLogEvents) ) )
app.add_route('/authenticate', AuthenticationResource( db, credentialStorage, sessionStorage, userStorage, logger.newProvider(LogSources.Authentication, AuthenticationLogEvents), authenticationSettingsStorage ) )
