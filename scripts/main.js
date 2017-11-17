d3.queue(2)
    .defer(d3.csv, "data/crimelogs.csv")
    .defer(d3.csv, "data/coordinates.csv")
    .awaitAll(ready);

function ready(error, results) {
  if (error) throw error;
  visual(results[0], results[1])
}

function visual (data, coord){
  var w = $(".full").width(),
      h = 200,
      p = {"top": 50, "right": 10, "left": 20, "bot": 20};
  var data = crossfilter(data);
  var type = data.dimension(function(d){ return d.Incident_Type})
  var types = type.group(); //key is Incident Type, value is count

  var location = data.dimension(function(d){ return d.Location})
  var locations = location.group();

  var date = data.dimension(function(d){ return d.Occurred.split(" ")[0]})
  var dates = date.group();
  var datesArray = dates.top(Infinity);
  datesArray.sort();
  
  var allTimes = datesArray.map(a => a.key.split(" ")[0]); //dates in an array
  allTimes.sort();
  allTimes = allTimes.map(a => new Date(a))


  var dateViz = d3.select("#dates").append("svg")
    .attr("width", w)
    .attr("height", h)

  var timeFormat = d3.timeFormat("%b %e");
  var weekend = d3.timeFormat("%a");
  var weekend2 = d3.timeFormat("%A");

  var timeScale = d3.scaleLinear()
    .domain([allTimes[0], allTimes[allTimes.length - 1]])
    .range([p.left, w-p.right])

  var timeAxis = d3.axisBottom(timeScale).tickFormat(timeFormat);

  dateViz.append("g")
      .attr("transform", "translate(0," + (h - p.bot) + ")")
      .call(timeAxis)


  var yScale = d3.scaleLinear()
    .domain([0, d3.max(datesArray.map(a=>a.value))])
    .range([h-p.bot, p.top])
  
  var yAxis = d3.axisLeft(yScale).ticks(5).tickSize(-w-p.right);

  var hScale = d3.scaleLinear()
    .domain([0, d3.max(datesArray.map(a=>a.value))])
    .range([0, h-p.bot-p.top])

  dateViz.append("g")
      .attr("class", "greyaxis")
      .attr("transform", "translate(" + p.left + ",0)")
      .call(yAxis)
        .selectAll("text")
        

  var tipTime = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return weekend2(new Date(d.key)) + ", " + timeFormat(new Date(d.key)) + "<br>" + d.value + " reports"; })

  dateViz.call(tipTime);

  dateViz.append("text")
    .attr("class", "graph-title")
    .style("text-anchor", "middle")
    .attr("x", (w-p.left-p.right)/2)
    .attr("y", 30)
    .text("Reported Incidents Over Time")

  dateViz.selectAll(".rectDate")
    .data(datesArray)
    .enter()
      .append("rect")
        .attr("x", function(d){
          return timeScale(new Date(d.key.split("-")[0]))
        })
        .attr("y", function(d){
          return yScale(d.value)
        })
        .attr("width", 10)
        .attr("height", function(d){
          return hScale(d.value)
        })
        .style("fill", function(d){
          if (weekend(new Date(d.key)) == "Sun" || weekend(new Date(d.key)) == "Sat"){
            return "grey"
          } else {
            return "black"
          }
        })
        .on("mouseover", function(d){
          tipTime.show(d)
        })
        .on("mouseout", function(d){
          tipTime.hide(d)
        })

  var narrViz = d3.select("#scatter").append("svg")
    .attr("width", w)
    .attr("height", h)

  var tipNarr = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return weekend2(new Date(d.Occurred)) + ", " + timeFormat(new Date(d.Occurred)) + "<br>" + d.Narrative; })

  var counter = Array.apply(null, Array(allTimes.length)).map(Number.prototype.valueOf,0);
  narrViz.call(tipNarr);
  narrViz.selectAll(".circNarr")
    .data(type.top(Infinity))
    .enter()
      .append("circle")
        .attr("cx", function(d){
          return timeScale(new Date(d.Occurred.split(" ")[0]))
        })
        .attr("cy", function(d){
          //console.log(new Date(d.Occurred.split(" ")[0]));
          //if (d.Occurred)
          //console.log(allTimes.indexOf(new Date(d.Occurred.split(" ")[0])));

          var index = allTimes.indexOf(new Date(d.Occurred.split(" ")[0]));
          counter[index] += 1;
          return yScale(1)
        })
        .attr("r", 5)
        .style("fill", function(d){
          if (weekend(new Date(d.Occurred)) == "Sun" || weekend(new Date(d.Occurred)) == "Sat"){
            return "grey"
          } else {
            return "black"
          }
        })
        .on("mouseover", function(d){
          tipNarr.show(d)
        })
        .on("mouseout", function(d){
          tipNarr.hide(d)
        })

  // create map object, tell it to live in 'map' div and give initial latitude, longitude, zoom values
  // pass option to turn scroll wheel zoom off
  var mymap = L.map('mapid').setView([42.4500, -76.4800], 16);
 
  // add base map tiles from OpenStreetMap and attribution info to 'map' div
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 18,
  minZoom: 14,
  }).addTo(mymap);

  console.log(locations.top(Infinity))
  var loc = coord.map(a => a.location);
  // add circle by passing center, radius, and some basic styles
  locations.top(Infinity).forEach(function(d){
    coord.forEach(function(e){
      if (e.location == d.key){
        d.latitude = e.latitude;
        d.longitude = e.longitude;
      }
    })
    console.log(d)
    var circle = L.circle([d.latitude, d.longitude], Math.sqrt(d.value)*10,{color:'red',opacity:1,fillColor: 'red',fillOpacity:.4}).addTo(mymap);
    circle.bindPopup(d.key + "<br>" + d.value + " incidents");
  })

}
