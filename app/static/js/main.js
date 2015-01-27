// Sets up scaffolding for the choropleth
// Responsive sizing for the chart
var width = $(".choro-container").width() + 100,
    height = 650;

// Scaling and initial D3 object
var droughtRate = d3.map();
var quantize = d3.scale.quantize()
  .domain([0, 5])
  .range(d3.range(6).map(function(i) {
    if (i === 0){
      return "none";
    }
    else {
      return "d" + (i-1);
    }
  }));

var projection = d3.geo.albersUsa()
  .scale(width)
  .translate([width / 2, height / 2]);

var path = d3.geo.path()
  .projection(projection);

// Creates SVG wrapper
var svg = d3.select("#choro").append("svg")
  .attr("width", width)
  .attr("height", height);

// First graph rendered w/ initiate()
function initiate(){
  appendDate(0);
  var file_name = files[0];

  queue()
    .defer(d3.json, "static/data/us.json")
    .defer(d3.csv, "static/data/saved/" + file_name + ".csv", function(d) { droughtRate.set(d.id, +d.level); })
    .await(ready);

  function ready(error, us) {
    svg.append("g")
      .attr("class", "counties")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.counties).features)
      .enter().append("path")
      .attr("class", function(d) {
        return quantize(droughtRate.get(d.id));
      })
      .attr("d", path);

    svg.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("class", "states")
      .attr("d", path);
  }
}

// Graph subsequently updated w/ update()
function update(fileIndex){
  var file = files[fileIndex]

  queue()
    .defer(d3.json, "static/data/us.json")
    .defer(d3.csv, "static/data/saved/" + file + ".csv", function(d) { droughtRate.set(d.id, +d.level); })
    .await(ready);

  function ready(error, us) {
    appendDate(fileIndex);
    document.querySelector('input[type=range]').value = fileIndex;

    var svg = d3.select("#choro")
    svg.select(".counties")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.counties).features)
      .attr("class", function(d) {
        return quantize(droughtRate.get(d.id));
      })
      .attr("d", path);
  }
}

// On user input, updates choropleth for closest date in the dataset
function updateForSelectedDate(){
  var date = $("#vizdate").val();
  var splitDate = date.split("-");
  var date = splitDate[0] + splitDate[1] + splitDate[2];

  var file = files[0];
  var currDate = file.split(".")[0];
  var currIndex = 0;

  // Loops thru to find closest dataset by date val, and grabs index
  var diff = Math.abs(date - currDate);
  for (var i = 0; i < files.length; i++){
    var file = files[i];
    var newDate = file.split(".")[0];
    var newDiff = Math.abs(date - newDate);
    if (newDiff <= diff){
      diff = newDiff;
      currDate = newDate;
      currIndex = i;
    }
  }

  // Stops interval if running and sets button accordingly
  clearInterval(interval);
  $("#start").html("Play");
  $("#start").prop("value", "play");

  // Updates graph w/ closest index, sets new interval starting point index
  update(currIndex);
  fileNumber = currIndex;
}

// Appends date text as graph title upon change
function appendDate(fileIndex){
  var date = files[fileIndex];
  // var date = file.split("_")[1];
  var splitDate = date.split("");

  var year = splitDate[0] + splitDate[1] + splitDate[2] + splitDate[3];
  var month = splitDate[4] + splitDate[5];
  var day = splitDate[6] + splitDate[7];

  if (month == 01) var monthName = "January";
  if (month == 02) var monthName = "February";
  if (month == 03) var monthName = "March";
  if (month == 04) var monthName = "April";
  if (month == 05) var monthName = "May";
  if (month == 06) var monthName = "June";
  if (month == 07) var monthName = "July";
  if (month == 08) var monthName = "August";
  if (month == 09) var monthName = "September";
  if (month == 10) var monthName = "October";
  if (month == 11) var monthName = "November";
  if (month == 12) var monthName = "December";

  var dateString = monthName + " " + day + ", " + year;

  $("#choro-title").html(dateString);
}

// Sets an interval to loop through the data sets -- intially .75 seconds
var fileNumber = 1;
var intervalCount = 750;
var interval = null;
function setLoop(value, count){
  intervalCount = count;
  var cycleTime = intervalCount / 1000;
  $("#cycle-time").html(cycleTime);

  if (interval) clearInterval(interval);

  if (value == "play"){
    interval = setInterval(function(){
      if (fileNumber >= files.length){
        fileNumber = 0
      }
      update(fileNumber++);
    }, count);
  }
  else {
    clearInterval(interval);
  }
}

// Creates an in scope array object of accessible data files
var files;
function generateFileList(json_data){
  files = json_data;
}


// Document Ready
$(function(){
  // Grabs date list, which is used to reference data files
  $.getJSON("static/data/saved/dates.json", function(json){
    console.log(json);
  }).done(function(json){
    generateFileList(json);
    initiate();
  });

  // Starts loop on scroll & pauses when past the control box
  var height = $(window).height()
  $(window).scroll(function(){
    var scroll = $(document).scrollTop()

    if (scroll < height){
      if (typeof interval !== "undefined"){
        clearInterval(interval);
        $("#start").html("Play");
        $("#start").prop("value", "play");
      }
    }

    if (scroll > height) {
      if (typeof interval !== "undefined"){
        clearInterval(interval);
        $("#start").html("Pause");
        $("#start").prop("value", "pause");
      }
      setLoop("play", intervalCount);
    }
  });

  // Controls the pause button
  $("#start").click(function(){
    setLoop(this.value, intervalCount);

    if (this.value == "pause"){
      $("#start").html("Play");
      $("#start").prop("value", "play");
    }
    else {
      $("#start").html("Pause");
      $("#start").prop("value", "pause");
    }
  });

  // Controls the cycle time submit button
  $("#cycle-submit").click(function(){
    setLoop("play", parseInt($('#cycle-time-select').val()));

    if ($("#start").val() == "play") {
      $("#start").html("Pause");
      $("#start").prop("value", "pause");
    }
  });

  // Smooth scrolling thanks to CSS tricks
  $('a[href*=#]:not([href=#])').click(function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top
        }, 1000);
        return false;
      }
    }
  });
});
