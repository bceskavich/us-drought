import os, json
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
    # Calls the two scraper functions to scrape and process new data
    scraper.get_drought_data()
    scraper.process_drought_data()

    # Gets length of date list for timeline bar
    with open(basedir + '/app/static/data/saved/dates.json', 'r') as datefile:
        dates = json.loads(datefile.read())
        date_length = len(dates)

    # Render page
    return render_template('index.html', date_length=date_length)
