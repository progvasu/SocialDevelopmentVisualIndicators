function parseTimeJoy(offset) {
            var date = new Date(1990, 0, 1); // chose an arbitrary day
            return d3.timeYear.offset(date, offset-1990);
        }

        d3.tsv('./data/joyplot_test.tsv', row, function (error, dataFlat) {
            if (error) throw error;

            var noOfCharts; 
            var dataLength;
				var xTickValues = []

        let colour = d3.scaleSequential(d3.interpolateInferno)
            .domain([100, 0])

        var formatTime = d3.timeFormat('%Y');

        const gradientColours = [
            { "offset": 10 },
            { "offset": 21 },
            { "offset": 40 },
            { "offset": 81 }
        ];

        const xDiagonal = 400;
        const zDiagonal = 800;
        const yHeight = 50;

        const xAngleDegrees = 26;
        const xzAngleDegrees = 95 + xAngleDegrees;
        const zAngleDegrees = 180 - xzAngleDegrees - xAngleDegrees;

        const xzAngle = xzAngleDegrees * (Math.PI / 180);
        const xAngle = xAngleDegrees * (Math.PI / 180); //between xDiagonal and horizontal
        const zAngle = zAngleDegrees * (Math.PI / 180);

        let xWidth = adjacentCos(xAngle, xDiagonal);
        let zWidth = adjacentCos(zAngle, zDiagonal);

        let xHeight = triangleSide(xWidth, xDiagonal);
        let zHeight = triangleSide(zWidth, zDiagonal);

        const margin = { "top": 10, "right": 150, "bottom": 50, "left": 80 };
        const containerHeight = xHeight + zHeight + yHeight;
        const containerWidth = xWidth + zWidth;

        let xScale = d3.scaleTime()
            .range([0, xWidth]);

        let yScale = d3.scaleLinear()
            .range([yHeight, 0]);

        let activityScale = d3.scaleBand()
            .range([0, zWidth]);

        let zScale = d3.scaleLinear()
            .domain([0, (noOfCharts - 1)])
            .range([0, zWidth])

        let area = d3.area()
            .x(function (d, i) {
                // console.log(d.time)
                return xScale(d.time);
            })
            .y0(function (d, i) {
                return yArea(0, i);
            })
            .y1(function (d, i) {
                return yArea(d.value, i);
            });

        let svg = d3.select("#joy")
            .append("svg")
            .attr("width", containerWidth + margin.left + margin.right)
            .attr("height", containerHeight + margin.top + margin.bottom);

        let defs = svg.append("defs");

        let gradient = defs.append("linearGradient")
            .attr("id", "gradient")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", yHeight)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("gradientTransform", "rotate(-" + xAngleDegrees + ",0,0)")

        gradient.selectAll("stop")
            .data(gradientColours)
            .enter()
            .append("stop")
            .attr("offset", function (d) { return d.offset + "%"; })
            .attr("stop-color", function (d) { return colour(d.offset); });

       let axes = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("class", "axes")

        let charts = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("class", "charts");

            // Sort by time
            dataFlat.sort(function (a, b) { return a.time - b.time; });

            var data = d3.nest()
                .key(function (d) { return d.activity; })
                .entries(dataFlat);

            // Sort activities by peak activity time
            function peakTime(d) {
                var i = d3.scan(d.values, function (a, b) { return b.value - a.value; });
                return d.values[i].time;
            };
            data.sort(function (a, b) { return peakTime(b) - peakTime(a); });

            noOfCharts = data.length;
						dataLength = data[0].values.length;
            
            xScale.domain(d3.extent(dataFlat, function (d) { return d.time; }));

            activityScale.domain(data.map(function (d) { return d.key; }));

            yScale.domain(d3.extent(dataFlat, function (d) { return d.value }));

        		/*for (t = 0; t < dataLength; t++) {
            	xTickValues[t] = t;
        		};*/
          
          	xTickValues = [0.1,0.2,0.3,.4,0.5,.6,0.7,.8,.9,.99]

            axes.call(drawXAxis);
            data.fa = ['67.4%', '65.5%', '39.5%', '40.4%', '49.7%', '71.5%', '72.7%', '51.0%', '56.5%', '52.4%'	]
            data.forEach(function (d, i) {

                // console.log(i)
                let series = i;
                let activity = d.key;
                let chartData = d.values;
                
                let g = charts.append("g")
                    .attr("transform", "translate(" + areaOffsetX(series) + "," + areaOffsetY(series) + ")");
                
                g.append("text")
                    .text(activity)
                    .attr("x", -5)
                    .attr("y", yHeight + 40)
                    .style("text-anchor", "end")

                // g.append("text")
                //     .text(data.fa[i])
                //     .attr("opacity", 0.8)
                //     .attr("font-size", 12)
                //     .attr("x", xWidth + 35)
                //     .attr("y", -130)
                //     .style("text-anchor", "end")

                let areaChart = g.append("path")
                    .datum(chartData)
                    .style("fill", "url(#gradient"/* + series + ")"*/)
                    .attr("stroke", "DarkSlateBlue")
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .attr("stroke-width", 1.5)
                    .style("opacity", 0.8)
                    .attr("d", area)
                		.on("mouseover", function(d){
                      d3.selectAll("path, .series-label").style("opacity", 0.1)
                      d3.select(this).style("opacity", 1)
                      d3.select(this.parentNode).select(".series-label").style("opacity", 1)
                    })
                		.on("mouseout", function(d){
                      d3.selectAll("path").style("opacity", 0.8)
                      d3.selectAll(".series-label").style("opacity", 1)
                    })

            })

   

        function areaOffsetX(i) {
            return i * (zWidth / (noOfCharts - 1))
        };

        function areaOffsetY(i) {
            let defaultY = containerHeight - zHeight - yHeight;
            let offset = i * (zHeight / (noOfCharts - 1));
            return defaultY + offset;
        };

        function yArea(d, i) {
            let n = xHeight * (i / dataLength);
            return yScale(d) - n;
        };

        function xCoord(x, y, z) {
            let x1 = xScale(x);
            let z1 = zScale(z);
            return seriesWidth + xScale(x) - zScale(z)
        };

        function yCoord(x, y, z) {
            let x1 = xHeight * (x / dataLength);
            let y1 = chartHeight - yScale(y);
            let z1 = zHeight * (z / noOfCharts);
            return height - (y1 + x1 + z1)
        };

        function drawXAxis(sel) {

            let xAxis = sel.append("g")
                .attr("id", "x-axis")
                .attr("transform", "translate(" + areaOffsetX(0) + "," + areaOffsetY(0) + ")");

            let xTicks = xAxis.selectAll(".ticks")
                .data(xTickValues)
                .enter()
                .append("g")
                .attr("class", "tick2")
                .attr("transform", function (d) {
                    let x = xWidth * (d);
                    let y = yArea(0, (dataLength * (d)));
                    return "translate(" + x + "," + y + ")"
                });

            let tickLength = zDiagonal + 25;
            let tickText = tickLength + 5;

            xTicks.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", adjacentCos(zAngle, tickLength))
                .attr("y2", oppositeSin(zAngle, tickLength));

            xTicks.append("text")
                .attr("class", "axis-label")
                .text(function (d) { return formatTime(xScale.invert(xWidth * (d))); })
                .attr("x", adjacentCos(zAngle, tickText))
                .attr("y", oppositeSin(zAngle, tickText));
        };
        });

        function row(d) {
            return {
                activity: d.activity,
                time: parseTimeJoy(d.time),
                value: +d.p_smooth
            };
        };