#################################################
# Dependencies
#################################################
# Flask (Server)
from flask import Flask, jsonify, render_template, request, flash, redirect

# SQL Alchemy (ORM)
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func, desc,select

import pandas as pd
import numpy as np


#################################################
# Database Setup

engine = create_engine("sqlite:///DataSets/belly_button_biodiversity.sqlite")

# reflect an existing database into a new model
Base = automap_base()
# reflect the tables
Base.prepare(engine, reflect=True)

# Save reference to the table
OTU = Base.classes.otu
Samples = Base.classes.samples
Samples_Metadata= Base.classes.samples_metadata

# Create our session (link) from Python to the DB
session = Session(engine)



### Flask setup
app = Flask(__name__)



# Create a route to return the dashboard homepage
@app.route("/")
def index ():
    return render_template("index.html")

# Create a route to return a List of sample names.
@app.route('/names')
def names():
    # Using Pandas, perform the SQL query
    stmt = session.query(Samples).statement
    df = pd.read_sql_query(stmt, session.bind)
    df.set_index("otu_id", inplace=True)
    nameList = list(df.columns)

    return jsonify(nameList)

    '''
    nameList=[]
    for each_name in df.columns[1:]:
        nameList.append(each_name)   
    nameList = {"otu_id":nameList}
    return nameList 
    '''

    

# Create a route to return a List of OTU descriptions.
@app.route('/otu')
def otu():
    results = session.query(OTU.lowest_taxonomic_unit_found).all()
    # Use numpy ravel to extract list of tuples into a list of OTU descriptions
    otu_list = list(np.ravel(results))

    return jsonify(otu_list)



# Create a route to return the MetaData for a given sample. (as json dictionary)
@app.route('/metadata/<sample>')
def sample_metadata(sample):
    sel = [Samples_Metadata.SAMPLEID, Samples_Metadata.AGE, 
            Samples_Metadata.BBTYPE, Samples_Metadata.ETHNICITY, 
            Samples_Metadata.GENDER, Samples_Metadata.LOCATION]

    # Args: Sample selected in the dropdown will be in the format: `BB_940`
    # filter the data from this table based on the stripped sample name
    # sample[3:] will strip the BB_ prefix from the sample name BB_940 to match the 
    # SAMPLEID in this Samples_Metadata table

    results = session.query(*sel).\
        filter(Samples_Metadata.SAMPLEID == sample[3:]).all()

    # create a dictionary for the metadata for each sample id
    sample_metadata = {}
    for result in results:
        sample_metadata['SAMPLEID'] = result[0]
        sample_metadata['AGE'] = result[1]
        sample_metadata['BBTYPE'] = result[2]
        sample_metadata['ETHNICITY'] = result[3]
        sample_metadata['GENDER'] = result[4]
        sample_metadata['LOCATION'] = result[5]

    return jsonify(sample_metadata)



# Create a route to return the Weekly Washing Frequency as a number.
@app.route('/wfreq/<sample>')
def sample_wfreq(sample):
    results = session.query(Samples_Metadata.WFREQ).\
        filter(Samples_Metadata.SAMPLEID == sample[3:]).all()
    wfreq = np.ravel(results)

    return jsonify(int(wfreq[0]))


# Create a route to return OTU IDs and Sample Values in Descending order (sorted)for a given sample
# in the form of dicstionaries
@app.route('/samples/<sample>')
def samples(sample):
    stmt = session.query(Samples).statement
    df = pd.read_sql_query(stmt, session.bind)

    # Check if sample is in the columns or else give an error message
    if sample not in df.columns:
        return jsonify(f"{sample} not found!!!"), 400

    # Sort the results by sample in descending order
    df = df.sort_values(by=sample, ascending=0)

    # Format the data to send as json
    data = [{"otu_ids": df[sample].index.values.tolist(),
             "sample_values": df[sample].values.tolist()}]
    
    return jsonify(data)


if __name__ == "__main__":
    app.run(debug=True)
   









    







