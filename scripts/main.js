d3.json("run_results.json", function(data) {
  visual(data);
  console.log(data)
})

function visual (data){
  var w = 500,
      h = 200,
      p = {"top": 10, "right": 10, "left": 10, "bottom": 10};
  var data = crossfilter(data);
  var type = data.dimension(function(d){ return d.Incident_Type})
  var types = type.group(); //key is Incident Type, value is count
  //console.log(types.top(Infinity));
  var date = data.dimension(function(d){ return d.Occured})
  var dates = date.group();
  var datesArray = dates.top(Infinity);
  var allTimes = datesArray.map(a => new Date(a.key.split("-")[0])); //dates in an array

  var timeScale = d3.scaleBand()
    .domain(allTimes.sort())
    .range([p.left, w-p.right])

  var dateViz = d3.select("#dates").append("svg")
    .attr("width", w)
    .attr("height", h)

  dateViz.selectAll("rect")
    .data(datesArray)
    .enter()
      .append("rect")
        .attr("x", function(d){
          return timeScale(new Date(d.key.split("-")[0]))
        })
        .attr("y", 5)
        .attr("width", 10)
        .attr("height", function(d){ return d.value * 10 })
}
