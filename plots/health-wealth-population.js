


// Load the data.
d3.json("./data/health-wealth.json", function(nations) {

function x(d) { return d.income; }
function y(d) { return d.lifeExpectancy; }
function radius(d) { return d.population; }
//function color(d) { return d.region; }
function key(d) { return d.name; }


  var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 120},
    width = document.body.clientWidth - margin.right - margin.left,
    height = 500 - margin.top - margin.bottom;

// Various scales. These domains make assumptions of data, naturally.
var xScale = d3.scaleLog()
							.domain([1e7, 8e13])
                            .range([0, width])
                            

var yScale = d3.scaleLinear()
							.domain([0, 100])
							.range([height, 0])

var radiusScale = d3.scaleSqrt()
										.domain([0, 5e8])
										.range([0, 20])

var colorScale = d3.scaleOrdinal(d3.schemeCategory10);
// var color = d3.scale.category20();
 
// The x & y axes.
var xAxis = d3.axisBottom()
							.scale(xScale)
                            .ticks(10, d3.format(",d"))
            
var yAxis = d3.axisLeft()
							.scale(yScale)

// Create the SVG container and set the origin.
var svg = d3.select("#health-wealth-population").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" +( margin.left) + "," + margin.top + ")");

// Add the x-axis.
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

// Add the y-axis.
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

// Add an x-axis label1.
svg.append("text")
    .attr("class", "x label1")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height - 6)
    .text("Adjusted net national income per capita (current US$)");

// Add a y-axis label1.
svg.append("text")
    .attr("class", "y label1")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Life expectancy at birth, total (years)");

// Add the year label1; the value is set on transition.
var label1 = svg.append("text")
    .attr("class", "year label1")
    .attr("text-anchor", "end")
    .attr("y", height - 24)
    .attr("x", width)
    .text(2000);


  // A bisector since many nation's data is sparsely-defined.
  var bisect = d3.bisector(function(d) { return d[0]; });

  // Add a dot per nation. Initialize the data at 2000, and set the colors.
  var dot = svg.append("g")
      .attr("class", "dots")
    .selectAll(".dot")
      .data(interpolateData(2000))
    .enter().append("circle")
      .attr("class", "dot")
      //.style("fill", d => colorScale(color(d)) )
      .attr("fill",function(d,i){return colorScale(i);})
      .call(position)
      .sort(order);

  // Add a title.
  dot.append("title")
      .text(function(d) { return [d.name, d.population]; });

  // Add an overlay for the year label1.

  //console.log(label1.node());
// console.log(label1.node());
var box1 = label1.node().getBBox();
// console.log(box1);
// console.log(box1.width);


  var overlay = svg.append("rect")
        .attr("class", "overlay")
        .attr("x", box1.x)
        .attr("y", box1.y)
        .attr("width", box1.width)
        .attr("height", box1.height)
        .on("mouseover", enableInteraction);

  // Start a transition that interpolates the data based on year.
  svg.transition()
      .duration(30000)
      .ease(d3.easeLinear)
      .tween("year", tweenYear)
      .on("end", enableInteraction);

  // Positions the dots based on data.
  function position(dot) {
    dot .attr("cx", d => xScale(x(d)) )
        .attr("cy", d => yScale(y(d)) )
        .attr("r",  d => radiusScale(radius(d)) );
  }

  // Defines a sort order so that the smallest dots are drawn on top.
  function order(a, b) {
    return radius(b) - radius(a);
  }

  // After the transition finishes, you can mouseover to change the year.
  function enableInteraction() {
    var yearScale = d3.scaleLinear()
        .domain([2000, 2017])
        .range([box1.x + 10, box1.x + box1.width - 10])
        .clamp(true);

    //Cancel the current transition, if any.
    svg.transition().duration(0);

    overlay
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("mousemove", mousemove)
        .on("touchmove", mousemove);

    function mouseover() {
      label1.classed("active", true);
    }

    function mouseout() {
      label1.classed("active", false);
    }

    function mousemove() {
      displayYear(yearScale.invert(d3.mouse(this)[0]));
    }
  }

  // Tweens the entire chart by first tweening the year, and then the data.
  // For the interpolated data, the dots and label1 are redrawn.
  function tweenYear() {
    var year = d3.interpolateNumber(2000, 2017);
    return function(t) { displayYear(year(t)); };
  }

  // Updates the display to show the specified year.
  function displayYear(year) {
    dot.data(interpolateData(year), key).call(position).sort(order);
    label1.text(Math.round(year));
  }

  // Interpolates the dataset for the given (fractional) year.
  function interpolateData(year) {
    return nations.map(function(d) {
      return {
        name: d.name,
        //region: d.region,
        income: interpolateValues(d.income, year),
        population: interpolateValues(d.population, year),
        lifeExpectancy: interpolateValues(d.lifeExpectancy, year)
      };
    });
  }

  // Finds (and possibly interpolates) the value for the specified year.
  function interpolateValues(values, year) {
      
    var i = bisect.left(values, year, 0, values.length - 1),
        a = values[i];
        // console.log(a, year);

    if (i > 0) {
      var b = values[i - 1],
          t = (year - a[0]) / (b[0] - a[0]);
      return a[1] * (1 - t) + b[1] * t;
    }
    return a[1];
  }
});
