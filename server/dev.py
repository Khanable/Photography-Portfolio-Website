from werkzeug.serving import run_simple
from __devBuild__.app import app

if __name__=='__main__':
    run_simple('localhost', 8000, app, use_reloader=True)
