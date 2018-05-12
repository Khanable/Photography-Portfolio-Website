import falcon
from server.mode import mode

class App:
	def __init__(self, mode=Mode.Development):
		rtn = falcon.API(middleware=SetDefaultResponseHeaders({
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'authorization, Content-Type'
				}))
		#app.add_route('/rebate',  RebateResource( db, rebateStorage, sessionStorage, logger.newProvider(LogSources.Rebate, RebateLogEvents) ) )
		return rtn;
