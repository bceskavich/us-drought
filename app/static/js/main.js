// Setup

var file_name = 'county_20000104_web.csv';

var width = $(".choro-container").width() + 100,
    height = 650;

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

var svg = d3.select("#choro").append("svg")
  .attr("width", width)
  .attr("height", height);

// First graph rendered w/ initiate()
function initiate(){
  appendDate(0);

  queue()
    .defer(d3.json, "static/data/us.json")
    .defer(d3.csv, "static/data/" + file_name, function(d) { droughtRate.set(d.id, +d.level); })
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
    .defer(d3.csv, "static/data/" + file, function(d) { droughtRate.set(d.id, +d.level); })
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
  var currDate = file.split("_")[1];
  var currIndex = 0;

  // Loops thru to find closest dataset by date val, and grabs index
  var diff = Math.abs(date - currDate);
  for (var i = 0; i < files.length; i++){
    var file = files[i];
    var newDate = file.split("_")[1];
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
  var file = files[fileIndex];
  var date = file.split("_")[1];
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
      if (fileNumber >= 775){
        fileNumber = 0
      }
      update(fileNumber++);
    }, count);
  }
  else {
    clearInterval(interval);
  }
}

// TODO - get date list
function getDates() {
  var dates = [];

}

// Document Ready
$(function(){
  initiate();

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

  $("#cycle-submit").click(function(){
    setLoop("play", parseInt($('#cycle-time-select').val()));

    if ($("#start").val() == "play") {
      $("#start").html("Pause");
      $("#start").prop("value", "pause");
    }
  });

  // Smoothscrolling goodness thanks to CSS tricks
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

// File List
var files = ['county_20000104_web.csv', 'county_20000111_web.csv', 'county_20000118_web.csv', 'county_20000125_web.csv', 'county_20000201_web.csv', 'county_20000208_web.csv', 'county_20000215_web.csv', 'county_20000222_web.csv', 'county_20000229_web.csv', 'county_20000307_web.csv', 'county_20000314_web.csv', 'county_20000321_web.csv', 'county_20000328_web.csv', 'county_20000404_web.csv', 'county_20000411_web.csv', 'county_20000418_web.csv', 'county_20000425_web.csv', 'county_20000502_web.csv', 'county_20000509_web.csv', 'county_20000516_web.csv', 'county_20000523_web.csv', 'county_20000530_web.csv', 'county_20000606_web.csv', 'county_20000613_web.csv', 'county_20000620_web.csv', 'county_20000627_web.csv', 'county_20000704_web.csv', 'county_20000711_web.csv', 'county_20000718_web.csv', 'county_20000725_web.csv', 'county_20000801_web.csv', 'county_20000808_web.csv', 'county_20000815_web.csv', 'county_20000822_web.csv', 'county_20000829_web.csv', 'county_20000905_web.csv', 'county_20000912_web.csv', 'county_20000919_web.csv', 'county_20000926_web.csv', 'county_20001003_web.csv', 'county_20001010_web.csv', 'county_20001017_web.csv', 'county_20001024_web.csv', 'county_20001031_web.csv', 'county_20001107_web.csv', 'county_20001114_web.csv', 'county_20001121_web.csv', 'county_20001128_web.csv', 'county_20001205_web.csv', 'county_20001212_web.csv', 'county_20001219_web.csv', 'county_20001226_web.csv', 'county_20010102_web.csv', 'county_20010109_web.csv', 'county_20010116_web.csv', 'county_20010123_web.csv', 'county_20010130_web.csv', 'county_20010206_web.csv', 'county_20010213_web.csv', 'county_20010220_web.csv', 'county_20010227_web.csv', 'county_20010306_web.csv', 'county_20010313_web.csv', 'county_20010320_web.csv', 'county_20010327_web.csv', 'county_20010403_web.csv', 'county_20010410_web.csv', 'county_20010417_web.csv', 'county_20010424_web.csv', 'county_20010501_web.csv', 'county_20010508_web.csv', 'county_20010515_web.csv', 'county_20010522_web.csv', 'county_20010529_web.csv', 'county_20010605_web.csv', 'county_20010612_web.csv', 'county_20010619_web.csv', 'county_20010626_web.csv', 'county_20010703_web.csv', 'county_20010710_web.csv', 'county_20010717_web.csv', 'county_20010724_web.csv', 'county_20010731_web.csv', 'county_20010807_web.csv', 'county_20010814_web.csv', 'county_20010821_web.csv', 'county_20010828_web.csv', 'county_20010904_web.csv', 'county_20010911_web.csv', 'county_20010918_web.csv', 'county_20010925_web.csv', 'county_20011002_web.csv', 'county_20011009_web.csv', 'county_20011016_web.csv', 'county_20011023_web.csv', 'county_20011030_web.csv', 'county_20011106_web.csv', 'county_20011113_web.csv', 'county_20011120_web.csv', 'county_20011127_web.csv', 'county_20011204_web.csv', 'county_20011211_web.csv', 'county_20011218_web.csv', 'county_20011225_web.csv', 'county_20020101_web.csv', 'county_20020108_web.csv', 'county_20020115_web.csv', 'county_20020122_web.csv', 'county_20020129_web.csv', 'county_20020205_web.csv', 'county_20020212_web.csv', 'county_20020219_web.csv', 'county_20020226_web.csv', 'county_20020305_web.csv', 'county_20020312_web.csv', 'county_20020319_web.csv', 'county_20020326_web.csv', 'county_20020402_web.csv', 'county_20020409_web.csv', 'county_20020416_web.csv', 'county_20020423_web.csv', 'county_20020430_web.csv', 'county_20020507_web.csv', 'county_20020514_web.csv', 'county_20020521_web.csv', 'county_20020528_web.csv', 'county_20020604_web.csv', 'county_20020611_web.csv', 'county_20020618_web.csv', 'county_20020625_web.csv', 'county_20020702_web.csv', 'county_20020709_web.csv', 'county_20020716_web.csv', 'county_20020723_web.csv', 'county_20020730_web.csv', 'county_20020806_web.csv', 'county_20020813_web.csv', 'county_20020820_web.csv', 'county_20020827_web.csv', 'county_20020903_web.csv', 'county_20020910_web.csv', 'county_20020917_web.csv', 'county_20020924_web.csv', 'county_20021001_web.csv', 'county_20021008_web.csv', 'county_20021015_web.csv', 'county_20021022_web.csv', 'county_20021029_web.csv', 'county_20021105_web.csv', 'county_20021112_web.csv', 'county_20021119_web.csv', 'county_20021126_web.csv', 'county_20021203_web.csv', 'county_20021210_web.csv', 'county_20021217_web.csv', 'county_20021224_web.csv', 'county_20021231_web.csv', 'county_20030107_web.csv', 'county_20030114_web.csv', 'county_20030121_web.csv', 'county_20030128_web.csv', 'county_20030204_web.csv', 'county_20030211_web.csv', 'county_20030218_web.csv', 'county_20030225_web.csv', 'county_20030304_web.csv', 'county_20030311_web.csv', 'county_20030318_web.csv', 'county_20030325_web.csv', 'county_20030401_web.csv', 'county_20030408_web.csv', 'county_20030415_web.csv', 'county_20030422_web.csv', 'county_20030429_web.csv', 'county_20030506_web.csv', 'county_20030513_web.csv', 'county_20030520_web.csv', 'county_20030527_web.csv', 'county_20030603_web.csv', 'county_20030610_web.csv', 'county_20030617_web.csv', 'county_20030624_web.csv', 'county_20030701_web.csv', 'county_20030708_web.csv', 'county_20030715_web.csv', 'county_20030722_web.csv', 'county_20030729_web.csv', 'county_20030805_web.csv', 'county_20030812_web.csv', 'county_20030819_web.csv', 'county_20030826_web.csv', 'county_20030902_web.csv', 'county_20030909_web.csv', 'county_20030916_web.csv', 'county_20030923_web.csv', 'county_20030930_web.csv', 'county_20031007_web.csv', 'county_20031014_web.csv', 'county_20031021_web.csv', 'county_20031028_web.csv', 'county_20031104_web.csv', 'county_20031111_web.csv', 'county_20031118_web.csv', 'county_20031125_web.csv', 'county_20031202_web.csv', 'county_20031209_web.csv', 'county_20031216_web.csv', 'county_20031223_web.csv', 'county_20031230_web.csv', 'county_20040106_web.csv', 'county_20040113_web.csv', 'county_20040120_web.csv', 'county_20040127_web.csv', 'county_20040203_web.csv', 'county_20040210_web.csv', 'county_20040217_web.csv', 'county_20040224_web.csv', 'county_20040302_web.csv', 'county_20040309_web.csv', 'county_20040316_web.csv', 'county_20040323_web.csv', 'county_20040330_web.csv', 'county_20040406_web.csv', 'county_20040413_web.csv', 'county_20040420_web.csv', 'county_20040427_web.csv', 'county_20040504_web.csv', 'county_20040511_web.csv', 'county_20040518_web.csv', 'county_20040525_web.csv', 'county_20040601_web.csv', 'county_20040608_web.csv', 'county_20040615_web.csv', 'county_20040622_web.csv', 'county_20040629_web.csv', 'county_20040706_web.csv', 'county_20040713_web.csv', 'county_20040720_web.csv', 'county_20040727_web.csv', 'county_20040803_web.csv', 'county_20040810_web.csv', 'county_20040817_web.csv', 'county_20040824_web.csv', 'county_20040831_web.csv', 'county_20040907_web.csv', 'county_20040914_web.csv', 'county_20040921_web.csv', 'county_20040928_web.csv', 'county_20041005_web.csv', 'county_20041012_web.csv', 'county_20041019_web.csv', 'county_20041026_web.csv', 'county_20041102_web.csv', 'county_20041109_web.csv', 'county_20041116_web.csv', 'county_20041123_web.csv', 'county_20041130_web.csv', 'county_20041207_web.csv', 'county_20041214_web.csv', 'county_20041221_web.csv', 'county_20041228_web.csv', 'county_20050104_web.csv', 'county_20050111_web.csv', 'county_20050118_web.csv', 'county_20050125_web.csv', 'county_20050201_web.csv', 'county_20050208_web.csv', 'county_20050215_web.csv', 'county_20050222_web.csv', 'county_20050301_web.csv', 'county_20050308_web.csv', 'county_20050315_web.csv', 'county_20050322_web.csv', 'county_20050329_web.csv', 'county_20050405_web.csv', 'county_20050412_web.csv', 'county_20050419_web.csv', 'county_20050426_web.csv', 'county_20050503_web.csv', 'county_20050510_web.csv', 'county_20050517_web.csv', 'county_20050524_web.csv', 'county_20050531_web.csv', 'county_20050607_web.csv', 'county_20050614_web.csv', 'county_20050621_web.csv', 'county_20050628_web.csv', 'county_20050705_web.csv', 'county_20050712_web.csv', 'county_20050719_web.csv', 'county_20050726_web.csv', 'county_20050802_web.csv', 'county_20050809_web.csv', 'county_20050816_web.csv', 'county_20050823_web.csv', 'county_20050830_web.csv', 'county_20050906_web.csv', 'county_20050913_web.csv', 'county_20050920_web.csv', 'county_20050927_web.csv', 'county_20051004_web.csv', 'county_20051011_web.csv', 'county_20051018_web.csv', 'county_20051025_web.csv', 'county_20051101_web.csv', 'county_20051108_web.csv', 'county_20051115_web.csv', 'county_20051122_web.csv', 'county_20051129_web.csv', 'county_20051206_web.csv', 'county_20051213_web.csv', 'county_20051220_web.csv', 'county_20051227_web.csv', 'county_20060103_web.csv', 'county_20060110_web.csv', 'county_20060117_web.csv', 'county_20060124_web.csv', 'county_20060131_web.csv', 'county_20060207_web.csv', 'county_20060214_web.csv', 'county_20060221_web.csv', 'county_20060228_web.csv', 'county_20060307_web.csv', 'county_20060314_web.csv', 'county_20060321_web.csv', 'county_20060328_web.csv', 'county_20060404_web.csv', 'county_20060411_web.csv', 'county_20060418_web.csv', 'county_20060425_web.csv', 'county_20060502_web.csv', 'county_20060509_web.csv', 'county_20060516_web.csv', 'county_20060523_web.csv', 'county_20060530_web.csv', 'county_20060606_web.csv', 'county_20060613_web.csv', 'county_20060620_web.csv', 'county_20060627_web.csv', 'county_20060704_web.csv', 'county_20060711_web.csv', 'county_20060718_web.csv', 'county_20060725_web.csv', 'county_20060801_web.csv', 'county_20060808_web.csv', 'county_20060815_web.csv', 'county_20060822_web.csv', 'county_20060829_web.csv', 'county_20060905_web.csv', 'county_20060912_web.csv', 'county_20060919_web.csv', 'county_20060926_web.csv', 'county_20061003_web.csv', 'county_20061010_web.csv', 'county_20061017_web.csv', 'county_20061024_web.csv', 'county_20061031_web.csv', 'county_20061107_web.csv', 'county_20061114_web.csv', 'county_20061121_web.csv', 'county_20061128_web.csv', 'county_20061205_web.csv', 'county_20061212_web.csv', 'county_20061219_web.csv', 'county_20061226_web.csv', 'county_20070102_web.csv', 'county_20070109_web.csv', 'county_20070116_web.csv', 'county_20070123_web.csv', 'county_20070130_web.csv', 'county_20070206_web.csv', 'county_20070213_web.csv', 'county_20070220_web.csv', 'county_20070227_web.csv', 'county_20070306_web.csv', 'county_20070313_web.csv', 'county_20070320_web.csv', 'county_20070327_web.csv', 'county_20070403_web.csv', 'county_20070410_web.csv', 'county_20070417_web.csv', 'county_20070424_web.csv', 'county_20070501_web.csv', 'county_20070508_web.csv', 'county_20070515_web.csv', 'county_20070522_web.csv', 'county_20070529_web.csv', 'county_20070605_web.csv', 'county_20070612_web.csv', 'county_20070619_web.csv', 'county_20070626_web.csv', 'county_20070703_web.csv', 'county_20070710_web.csv', 'county_20070717_web.csv', 'county_20070724_web.csv', 'county_20070731_web.csv', 'county_20070807_web.csv', 'county_20070814_web.csv', 'county_20070821_web.csv', 'county_20070828_web.csv', 'county_20070904_web.csv', 'county_20070911_web.csv', 'county_20070918_web.csv', 'county_20070925_web.csv', 'county_20071002_web.csv', 'county_20071009_web.csv', 'county_20071016_web.csv', 'county_20071023_web.csv', 'county_20071030_web.csv', 'county_20071106_web.csv', 'county_20071113_web.csv', 'county_20071120_web.csv', 'county_20071127_web.csv', 'county_20071204_web.csv', 'county_20071211_web.csv', 'county_20071218_web.csv', 'county_20071225_web.csv', 'county_20080101_web.csv', 'county_20080108_web.csv', 'county_20080115_web.csv', 'county_20080122_web.csv', 'county_20080129_web.csv', 'county_20080205_web.csv', 'county_20080212_web.csv', 'county_20080219_web.csv', 'county_20080226_web.csv', 'county_20080304_web.csv', 'county_20080311_web.csv', 'county_20080318_web.csv', 'county_20080325_web.csv', 'county_20080401_web.csv', 'county_20080408_web.csv', 'county_20080415_web.csv', 'county_20080422_web.csv', 'county_20080429_web.csv', 'county_20080506_web.csv', 'county_20080513_web.csv', 'county_20080520_web.csv', 'county_20080527_web.csv', 'county_20080603_web.csv', 'county_20080610_web.csv', 'county_20080617_web.csv', 'county_20080624_web.csv', 'county_20080701_web.csv', 'county_20080708_web.csv', 'county_20080715_web.csv', 'county_20080722_web.csv', 'county_20080729_web.csv', 'county_20080805_web.csv', 'county_20080812_web.csv', 'county_20080819_web.csv', 'county_20080826_web.csv', 'county_20080902_web.csv', 'county_20080909_web.csv', 'county_20080916_web.csv', 'county_20080923_web.csv', 'county_20080930_web.csv', 'county_20081007_web.csv', 'county_20081014_web.csv', 'county_20081021_web.csv', 'county_20081028_web.csv', 'county_20081104_web.csv', 'county_20081111_web.csv', 'county_20081118_web.csv', 'county_20081125_web.csv', 'county_20081202_web.csv', 'county_20081209_web.csv', 'county_20081216_web.csv', 'county_20081223_web.csv', 'county_20081230_web.csv', 'county_20090106_web.csv', 'county_20090113_web.csv', 'county_20090120_web.csv', 'county_20090127_web.csv', 'county_20090203_web.csv', 'county_20090210_web.csv', 'county_20090217_web.csv', 'county_20090224_web.csv', 'county_20090303_web.csv', 'county_20090310_web.csv', 'county_20090317_web.csv', 'county_20090324_web.csv', 'county_20090331_web.csv', 'county_20090407_web.csv', 'county_20090414_web.csv', 'county_20090421_web.csv', 'county_20090428_web.csv', 'county_20090505_web.csv', 'county_20090512_web.csv', 'county_20090519_web.csv', 'county_20090526_web.csv', 'county_20090602_web.csv', 'county_20090609_web.csv', 'county_20090616_web.csv', 'county_20090623_web.csv', 'county_20090630_web.csv', 'county_20090707_web.csv', 'county_20090714_web.csv', 'county_20090721_web.csv', 'county_20090728_web.csv', 'county_20090804_web.csv', 'county_20090811_web.csv', 'county_20090818_web.csv', 'county_20090825_web.csv', 'county_20090901_web.csv', 'county_20090908_web.csv', 'county_20090915_web.csv', 'county_20090922_web.csv', 'county_20090929_web.csv', 'county_20091006_web.csv', 'county_20091013_web.csv', 'county_20091020_web.csv', 'county_20091027_web.csv', 'county_20091103_web.csv', 'county_20091110_web.csv', 'county_20091117_web.csv', 'county_20091124_web.csv', 'county_20091201_web.csv', 'county_20091208_web.csv', 'county_20091215_web.csv', 'county_20091222_web.csv', 'county_20091229_web.csv', 'county_20100105_web.csv', 'county_20100112_web.csv', 'county_20100119_web.csv', 'county_20100126_web.csv', 'county_20100202_web.csv', 'county_20100209_web.csv', 'county_20100216_web.csv', 'county_20100223_web.csv', 'county_20100302_web.csv', 'county_20100309_web.csv', 'county_20100316_web.csv', 'county_20100323_web.csv', 'county_20100330_web.csv', 'county_20100406_web.csv', 'county_20100413_web.csv', 'county_20100420_web.csv', 'county_20100427_web.csv', 'county_20100504_web.csv', 'county_20100511_web.csv', 'county_20100518_web.csv', 'county_20100525_web.csv', 'county_20100601_web.csv', 'county_20100608_web.csv', 'county_20100615_web.csv', 'county_20100622_web.csv', 'county_20100629_web.csv', 'county_20100706_web.csv', 'county_20100713_web.csv', 'county_20100720_web.csv', 'county_20100727_web.csv', 'county_20100803_web.csv', 'county_20100810_web.csv', 'county_20100817_web.csv', 'county_20100824_web.csv', 'county_20100831_web.csv', 'county_20100907_web.csv', 'county_20100914_web.csv', 'county_20100921_web.csv', 'county_20100928_web.csv', 'county_20101005_web.csv', 'county_20101012_web.csv', 'county_20101019_web.csv', 'county_20101026_web.csv', 'county_20101102_web.csv', 'county_20101109_web.csv', 'county_20101116_web.csv', 'county_20101123_web.csv', 'county_20101130_web.csv', 'county_20101207_web.csv', 'county_20101214_web.csv', 'county_20101221_web.csv', 'county_20101228_web.csv', 'county_20110104_web.csv', 'county_20110111_web.csv', 'county_20110118_web.csv', 'county_20110125_web.csv', 'county_20110201_web.csv', 'county_20110208_web.csv', 'county_20110215_web.csv', 'county_20110222_web.csv', 'county_20110301_web.csv', 'county_20110308_web.csv', 'county_20110315_web.csv', 'county_20110322_web.csv', 'county_20110329_web.csv', 'county_20110405_web.csv', 'county_20110412_web.csv', 'county_20110419_web.csv', 'county_20110426_web.csv', 'county_20110503_web.csv', 'county_20110510_web.csv', 'county_20110517_web.csv', 'county_20110524_web.csv', 'county_20110531_web.csv', 'county_20110607_web.csv', 'county_20110614_web.csv', 'county_20110621_web.csv', 'county_20110628_web.csv', 'county_20110705_web.csv', 'county_20110712_web.csv', 'county_20110719_web.csv', 'county_20110726_web.csv', 'county_20110802_web.csv', 'county_20110809_web.csv', 'county_20110816_web.csv', 'county_20110823_web.csv', 'county_20110830_web.csv', 'county_20110906_web.csv', 'county_20110913_web.csv', 'county_20110920_web.csv', 'county_20110927_web.csv', 'county_20111004_web.csv', 'county_20111011_web.csv', 'county_20111018_web.csv', 'county_20111025_web.csv', 'county_20111101_web.csv', 'county_20111108_web.csv', 'county_20111115_web.csv', 'county_20111122_web.csv', 'county_20111129_web.csv', 'county_20111206_web.csv', 'county_20111213_web.csv', 'county_20111220_web.csv', 'county_20111227_web.csv', 'county_20120103_web.csv', 'county_20120110_web.csv', 'county_20120117_web.csv', 'county_20120124_web.csv', 'county_20120131_web.csv', 'county_20120207_web.csv', 'county_20120214_web.csv', 'county_20120221_web.csv', 'county_20120228_web.csv', 'county_20120306_web.csv', 'county_20120313_web.csv', 'county_20120320_web.csv', 'county_20120327_web.csv', 'county_20120403_web.csv', 'county_20120410_web.csv', 'county_20120417_web.csv', 'county_20120424_web.csv', 'county_20120501_web.csv', 'county_20120508_web.csv', 'county_20120515_web.csv', 'county_20120522_web.csv', 'county_20120529_web.csv', 'county_20120605_web.csv', 'county_20120612_web.csv', 'county_20120619_web.csv', 'county_20120626_web.csv', 'county_20120703_web.csv', 'county_20120710_web.csv', 'county_20120717_web.csv', 'county_20120724_web.csv', 'county_20120731_web.csv', 'county_20120807_web.csv', 'county_20120814_web.csv', 'county_20120821_web.csv', 'county_20120828_web.csv', 'county_20120904_web.csv', 'county_20120911_web.csv', 'county_20120918_web.csv', 'county_20120925_web.csv', 'county_20121002_web.csv', 'county_20121009_web.csv', 'county_20121016_web.csv', 'county_20121023_web.csv', 'county_20121030_web.csv', 'county_20121106_web.csv', 'county_20121113_web.csv', 'county_20121120_web.csv', 'county_20121127_web.csv', 'county_20121204_web.csv', 'county_20121211_web.csv', 'county_20121218_web.csv', 'county_20121225_web.csv', 'county_20130101_web.csv', 'county_20130108_web.csv', 'county_20130115_web.csv', 'county_20130122_web.csv', 'county_20130129_web.csv', 'county_20130205_web.csv', 'county_20130212_web.csv', 'county_20130219_web.csv', 'county_20130226_web.csv', 'county_20130305_web.csv', 'county_20130312_web.csv', 'county_20130319_web.csv', 'county_20130326_web.csv', 'county_20130402_web.csv', 'county_20130409_web.csv', 'county_20130416_web.csv', 'county_20130423_web.csv', 'county_20130430_web.csv', 'county_20130507_web.csv', 'county_20130514_web.csv', 'county_20130521_web.csv', 'county_20130528_web.csv', 'county_20130604_web.csv', 'county_20130611_web.csv', 'county_20130618_web.csv', 'county_20130625_web.csv', 'county_20130702_web.csv', 'county_20130709_web.csv', 'county_20130716_web.csv', 'county_20130723_web.csv', 'county_20130730_web.csv', 'county_20130806_web.csv', 'county_20130813_web.csv', 'county_20130820_web.csv', 'county_20130827_web.csv', 'county_20130903_web.csv', 'county_20130910_web.csv', 'county_20130917_web.csv', 'county_20130924_web.csv', 'county_20131001_web.csv', 'county_20131008_web.csv', 'county_20131015_web.csv', 'county_20131022_web.csv', 'county_20131029_web.csv', 'county_20131105_web.csv', 'county_20131112_web.csv', 'county_20131119_web.csv', 'county_20131126_web.csv', 'county_20131203_web.csv', 'county_20131210_web.csv', 'county_20131217_web.csv', 'county_20131224_web.csv', 'county_20131231_web.csv', 'county_20140107_web.csv', 'county_20140114_web.csv', 'county_20140121_web.csv', 'county_20140128_web.csv', 'county_20140204_web.csv', 'county_20140211_web.csv', 'county_20140218_web.csv', 'county_20140225_web.csv', 'county_20140304_web.csv', 'county_20140311_web.csv', 'county_20140318_web.csv', 'county_20140325_web.csv', 'county_20140401_web.csv', 'county_20140408_web.csv', 'county_20140415_web.csv', 'county_20140422_web.csv', 'county_20140429_web.csv', 'county_20140506_web.csv', 'county_20140513_web.csv', 'county_20140520_web.csv', 'county_20140527_web.csv', 'county_20140603_web.csv', 'county_20140610_web.csv', 'county_20140617_web.csv', 'county_20140624_web.csv', 'county_20140701_web.csv', 'county_20140708_web.csv', 'county_20140715_web.csv', 'county_20140722_web.csv', 'county_20140729_web.csv', 'county_20140805_web.csv', 'county_20140812_web.csv', 'county_20140819_web.csv', 'county_20140826_web.csv', 'county_20140902_web.csv', 'county_20140909_web.csv', 'county_20140916_web.csv', 'county_20140923_web.csv', 'county_20140930_web.csv', 'county_20141007_web.csv', 'county_20141014_web.csv', 'county_20141021_web.csv', 'county_20141028_web.csv', 'county_20141104_web.csv'];
