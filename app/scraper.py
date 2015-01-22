import requests
import urllib
import json
import os
import sys
import csv
from config import basedir

def check_date(dates):
    """
    Finds all dates from DM source not yet loaded, returns list
    """

    # Loads file list from raw and processed data dirs
    data_dir = basedir + '/app/static/data/saved'
    data_files = [f for f in os.listdir(data_dir) if not f.startswith('.DS')]

    print data_files

    raw_data_dir = basedir + '/app/static/data/raw'
    raw_data_files = [f for f in os.listdir(raw_data_dir) if not f.startswith('.DS')]

    # If neither a raw or processed file exists, we haven't collected it
    # Sorts these uncollected files by date for reference
    if data_files or raw_data_files:
        saved_dates = []
        raw_dates = []

        if data_files:
            saved_dates = [data_file.split('.')[0] for data_file in data_files]
            saved_dates = sorted(saved_dates, reverse=True)
        if raw_data_files:
            raw_dates = [raw_file.split('.')[0] for raw_file in raw_data_files]
            raw_dates = sorted(raw_dates, reverse=True)

        uncrawled_dates = []
        for date in dates:
            if date not in saved_dates and date not in raw_dates:
                uncrawled_dates.append(date)
    else:
        uncrawled_dates = dates

    print 'Uncrawled file dates'
    print uncrawled_dates
    print ''

    return uncrawled_dates

def get_drought_data():
    """
    Pulls raw data from the USDM
    """

    # Base URL for the DM homepage & AJAX URL for simulated request
    url = 'http://droughtmonitor.unl.edu/MapsAndData/GISData.aspx'
    ajax_url = 'http://droughtmonitor.unl.edu/Ajax.aspx/ReturnDMWeeks'

    # Based on AJAX HTTP POST request
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
    }

    # Sets requests Session & sends simulated AJAX request
    s = requests.Session()
    s.head(url)
    r = s.post(ajax_url, data='{}', headers=headers)

    # Grabs data, a list of valid dates for file reference
    json_data = json.loads(r.text)
    file_dates = json_data['d']

    print 'Writing file dates...'

    # Writes the USDM dates to a file for D3 reference
    datefile = open(basedir + '/app/static/data/saved/dates.json', 'w')
    datefile.write(json.dumps(sorted(file_dates), indent=1))
    datefile.close()

    print 'File dates from the USDM:'
    print file_dates
    print ''
    print 'Now comparing...'
    print ''

    dates = check_date(file_dates)
    if dates:
        file_dates = dates
        print 'Now collecting...'

        # Base URL for data files
        base_url = 'http://usdmdataservices.unl.edu/?mode=table'

        # Loops thru dates, saves files based on geographical focus & date
        for date in file_dates:
            fileout = urllib.URLopener()
            fileout.retrieve(base_url + '&aoi=county&date=' + date, basedir + '/app/static/data/raw/' + date + '.csv')

        print 'Finished.'
    else:
        print 'All data collected to date.'

def process_drought_data():
    """
    If raw data files have been collected, this function will process them
    to a JSON format usable by the D3 viz on the front-end
    """
    raw_data_dir = basedir + '/app/static/data/raw'
    raw_data_files = os.listdir(raw_data_dir)

    if raw_data_files:
        print 'Raw data files to process:'
        print raw_data_files
        print ''
        print 'Total to process: %d' % len(raw_data_files)

        count = 1
        for raw_file in raw_data_files:
            print 'Processing %d of %d raw files.' % (count, len(raw_data_files))

            # opens raw file to read data
            readfile = open(basedir + '/app/static/data/raw/' + raw_file, 'r')
            reader = csv.reader(readfile, delimiter=',')

            # sets up processed file for writing
            raw_file_name = raw_file.split('.')[0]
            out_file_name = raw_file_name + '.csv'
            writefile = open(basedir + '/app/static/data/saved/' + out_file_name, 'w')
            writer = csv.writer(writefile, delimiter=',')
            writer.writerow(['id', 'level'])

            for line in reader:
                if line[1] == 'FIPS':
                    pass
                else:
                    fips = int(line[1])

                    level = 0
                    if float(line[9]) > 0:
                        level = 5
                    elif float(line[8]) > 0:
                        level = 4
                    elif float(line[7]) > 0:
                        level = 3
                    elif float(line[6]) > 0:
                        level = 2
                    elif float(line[5]) > 0:
                        level = 1

                    writer.writerow([fips, level])

            writefile.close()
            readfile.close()
            os.remove(basedir + '/app/static/data/raw/' + raw_file)
            count += 1

    else:
        print 'All files have been processed.'
