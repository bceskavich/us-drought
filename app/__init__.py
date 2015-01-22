import os
from flask import render_template, flash, redirect, session, url_for, request, g
from flask import Flask
from config import basedir

app = Flask(__name__)
app.debug=True
app.config.from_object('config')

from app import scraper

@app.route('/')
@app.route('/index')
def index():
    scraper.get_drought_data()
    scraper.process_drought_data()
    file_list = os.listdir(basedir + '/app/static/data/saved')
    return render_template('index.html', file_list=file_list)
