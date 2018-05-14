console.log("loaded fine");

function updateMetaData(data) {
    // Reference to panel element for sample metadata
    var PANEL = document.getElementById('sample-metadata');
    // Clear any existing metadata
    PANEL.innerHTML = '';
    // Loop through all the elements in the json response and create new metadata tags
    for (var key in data) {
        h6tag = document.createElement("h6");
        h6Text = document.createTextNode(`${key}: ${data[key]}`);
        h6tag.append(h6Text);
        PANEL.appendChild(h6tag);
    }
}


function buildCharts(sampleData, otuData) {
    // Loop through sample data and find the OTU Taxonomic Name
    var labels = sampleData[0]['otu_ids'].map(function(item) {
        return otuData[item]
    });

    // Build Pie Chart
    console.log(sampleData[0]['sample_values'].slice(0,10))
    var pieData = [{
        values: sampleData[0]['sample_values'].slice(0, 10),
        labels: sampleData[0]['otu_ids'].slice(0, 10),
        hovertext: labels.slice(0, 10),
        hoverinfo: 'hovertext',
        type: 'pie'
    }];
    var pieLayout = {
        margin: { t: 0, l: 0 }
    };
    var PIE = document.getElementById('pie');
    Plotly.plot(PIE, pieData, pieLayout);
    console.log("ending pie chart");

    // Build Bubble Chart
    console.log("starting bubble chart");
    var bubbleData = [{
        x: sampleData[0]['otu_ids'],
        y: sampleData[0]['sample_values'],
        text: labels,
        mode: 'markers',
        marker: {
            size: sampleData[0]['sample_values'],
            color: sampleData[0]['otu_ids'],
            colorscale: 'Earth'
        }
    }];
    var bubbleLayout = {
        margin: {t: 0},
        hovermode: 'closest',
        xaxis: {title: 'OTU_ID'}
    };
    var BUBBLE = document.getElementById('bubble');
    Plotly.plot(BUBBLE, bubbleData, bubbleLayout);

};

// Update the charts whenever a new sample id is selected
function updateCharts(sampleData, otuData) {
    var sampleValues = sampleData[0]['sample_values'];
    var otuIDs = sampleData[0]['otu_ids'];
    // Return the OTU Description for each otuID in the dataset
    var labels = otuIDs.map(function(item) {
        return otuData[item]
    });

    // Update the Pie Chart with the new data
    // Use slice to select only the top 10 OTUs for the pie chart
    var PIE = document.getElementById('pie');
    var pieUpdate = {
        values: [sampleValues.slice(0, 10)],
        labels: [otuIDs.slice(0, 10)],
        hovertext: [labels.slice(0, 10)],
        hoverinfo: 'hovertext',
        type: 'pie'
    };
    Plotly.restyle(PIE, pieUpdate);

    // Update the Bubble Chart with the new data
    var BUBBLE = document.getElementById('bubble');
    Plotly.restyle(BUBBLE, 'x', [otu_IDs]);
    Plotly.restyle(BUBBLE, 'y', [sampleValues]);
    Plotly.restyle(BUBBLE, 'text', [lables]);
    Plotly.restyle(BUBBLE, 'marker-size', [SampleValues]);
    Plotly.restyle(BUBBLE,'marker-color', [otuIDs]);
}


function getData(sample, callback) {
    // Use a request to grab the json data needed for all charts
    Plotly.d3.json(`/samples/${sample}`, function(error, sampleData) {
        if (error) return console.warn(error);
        Plotly.d3.json('/otu', function(error, otuData) {
            if (error) return console.warn(error);
            callback(sampleData, otuData);
        });
    });
    Plotly.d3.json(`/metadata/${sample}`, function(error, metaData) {
        if (error) return console.warn(error);
        updateMetaData(metaData);
    });
}


function getOptions() {
    // Get a reference to the dropdown select element
    var selector = document.getElementById('selDataset');
    
    // Populate the select option by using the list of sample names
    Plotly.d3.json('/names', function(error, sampleNames) {
        for (var i = 0; i < sampleNames.length; i++) {
            var currentOption = document.createElement('option');
            currentOption.text = sampleNames[i];
            currentOption.value = sampleNames[i];
            selector.appendChild(currentOption);
        };
        getData(sampleNames[0], buildCharts);
    });
}


function optionChanged(newSample) {
    // Fetch new data every time a new sample is selected
    getData(newSample, updateCharts);
}


function init() {
    getOptions();
}

init();

