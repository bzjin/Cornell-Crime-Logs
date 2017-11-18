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
  console.log(types.top(Infinity))

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

  var narrAxis = d3.axisBottom(timeScale).tickFormat(timeFormat);

  narrViz.append("g")
      .attr("transform", "translate(0," + (h - p.bot) + ")")
      .call(narrAxis)

  var tipNarr = d3.tip()
    .attr('class', 'd3-tip2')
    .offset([-10, 0])
    .html(function(d) {
      var occured = new Date(d.Occurred.split(" ")[0]);
      return weekend2(occured) + ", " + timeFormat(occured) + 
      "<br>" + d.Location + 
      "<br>" + "<span class='bolded'>" + d.Incident_Type + "</span>" + 
      "<br>" + d.Narrative; 
    })

  var counter = Array.apply(null, Array(allTimes.length)).map(Number.prototype.valueOf,0);
  var allTimesCompare = allTimes.map(a=>a.getTime());
  narrViz.call(tipNarr);
  
  narrViz.selectAll(".circNarr")
    .data(type.top(Infinity))
    .enter()
      .append("circle")
        .attr("id", function(d){
          return d.Incident_Type.split(" ")[0];
        })
        .attr("cx", function(d){
          return timeScale(new Date(d.Occurred.split(" ")[0]))
        })
        .attr("cy", function(d){
          var index = allTimesCompare.indexOf(new Date(d.Occurred.split(" ")[0]).getTime());
          counter[index] += 1;
          //console.log(counter, counter[index])
          return yScale(counter[index])
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
          d3.select(this)
            .style("opacity", .5)
        })
        .on("mouseout", function(d){
          tipNarr.hide(d)
          d3.select(this)
            .style("opacity", 1)
        })

  var colorScale = d3.scaleOrdinal(d3.schemeCategory20).range().concat(d3.scaleOrdinal(d3.schemeCategory20b).range());
  
  //button
  for (i=0; i<types.top(Infinity).length; i++){
      var button = document.createElement("button");
      button.innerHTML = types.top(Infinity)[i].key + " (" + types.top(Infinity)[i].value + ")";
      button.setAttribute('id', types.top(Infinity)[i].key.split(" ")[0]); 
      button.setAttribute('class', i + " button"); 
      button.addEventListener('click', function(e){
          var self = this;
          var index = d3.select(this).attr("class").split(" ")[0];
          var thistype = d3.select(this).attr("id");
          // if not clicked, then add features
          if (d3.select(this).classed("clicked") == false){
            self.style.background = colorScale[index];
            self.style.color = "white"; 
            $(self).addClass("clicked");
            d3.selectAll("#" + thistype).style("fill", colorScale[index]);
          // if clicked, then remove features
          } else {
            self.style.background = "white";
            self.style.color = "black"; 
            $(self).removeClass("clicked");
            d3.selectAll("#" + thistype).style("fill", "black");
          }
      });
      button.addEventListener('mouseover', function(e){
          //console.log(this)
          var self = this;
          var index = d3.select(this).attr("class").split(" ")[0];
          var thistype = d3.select(this).attr("id");
          self.style.background = colorScale[index];
          self.style.color = "white"; 
          d3.selectAll("#" + thistype).style("fill", colorScale[index]);
      });
      button.addEventListener('mouseout', function(e){
          var self = this;
          var index = d3.select(this).attr("class").split(" ")[0];
          var thistype = d3.select(this).attr("id");
          if (d3.select(self).classed("clicked") == false){
            self.style.background = "white";
            self.style.color = "black"; 
            d3.selectAll("#" + thistype).style("fill", "black");
          } else {
            $(self).addClass("clicked");
            d3.selectAll("#" + thistype).style("fill", colorScale[index]);
          }
      });
      document.getElementById("types_checkbox").appendChild(button);
  }

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
    var circle = L.circle([d.latitude, d.longitude], Math.sqrt(d.value)*10,{color:'red',opacity:1,fillColor: 'red',fillOpacity:.4}).addTo(mymap);
    circle.bindPopup(function(){
      var str = "<b>" + d.key + "</b><br>" + d.value + " incidents";
      var locs = location.top(Infinity).filter(function(e){ return e.Location == d.key})
      locs.forEach(function(e){
        str = str + "<br><b>" + e.Occurred.split(" ")[0] + ":</b> " + e.Narrative;
      })
      return str;
    });
  })

}
