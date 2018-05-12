from sys import modules
from importlib import import_module
modules['server'] = import_module('src')

from werkzeug.serving import run_simple
from server.app import App 
from server.mode import Mode

if __name__=='__main__':
	app = App(mode=Mode.Development)
	run_simple('localhost', 8000, app, use_reloader=True)
