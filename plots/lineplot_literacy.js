var margin_lit = {
    top:20,
    right:400,
    bottom:30,
    left:50
};

var w_lit = document.body.clientWidth - margin_lit.left - margin_lit.right;
var h_lit = 750 - margin_lit.top - margin_lit.bottom;

d3.tsv("./data/literacy_rate_final.tsv", function(error, data) {
    if (error) throw error;

    var svg = d3.select("#bodyLiteracy").append("svg")
            .attr("id", "line_plot_lit")
            .attr("width",w_lit + margin_lit.left + margin_lit.right)
            .attr("height",h_lit + margin_lit.top + margin_lit.bottom)
            .append("g")
            .attr("transform","translate("+margin_lit.left +","+margin_lit.top+")")
    
    var parseDateLit = d3.timeParse("%Y");
    var scaleX = d3.scaleTime().range([0, w_lit]);
    var scaleY = d3.scaleLinear().range([h_lit, 0]);
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    var xAxis = d3.axisBottom().scale(scaleX).ticks(20);
    var yAxis = d3.axisLeft().scale(scaleY).ticks(20);

    color.domain(d3.keys(data[0]).filter(function(key){
        // console.log("key", key)
        return key!=="date";
    }))

    var lineLit = d3.line()
            .x(function(d){
                return scaleX(d.date)
            })
            .y(function(d){
                return scaleY(d.temperature)
            })

    data.forEach(function(d){
        d.date = parseDateLit(d.date);
    });

    var cities = color.domain().map(function(name){
        return {
            name:name,
            values:data.map(function(d){
                return {
                    date:d.date,
                    temperature:+d[name]
                };
            })
        };
    });

    scaleX.domain(d3.extent(data,function(d){
        return d.date;
    }));

    scaleY.domain([
        d3.min(cities,function(c){
            return d3.min(c.values,function(v){
                return v.temperature
            })
        }),
        d3.max(cities,function(c){
            return d3.max(c.values,function(v){
                return v.temperature;
            })
        })
    ])

    // console.log("cities",cities);

    var legend = svg.selectAll("g")
                    .data(cities)
                    .enter()
                    .append("g")
                    .attr("class","legend");

    legend.append("rect")
        .attr("x",w_lit+150)
        .attr("y",function(d,i){
            return i * 20;
        })
        .attr("width",10)
        .attr("height",10)
        .style("fill",function(d){
            return color(d.name);
        });

    legend.append("text")
        .attr("x",w_lit+165)
        .attr("y",function(d,i){
            return (i * 20) + 9;
        })
        .text(function(d){
            return d.name;
        });

    svg.append("g")
        .attr("class","x axis")
        .attr("transform","translate(0,"+h_lit+")")
        .call(xAxis);

    svg.append("g")
        .attr("class","y axis")
        .call(yAxis)
        .append("text")
        .attr("transform","rotate(-90)")
        .attr("y", 6)
        .attr("dy",".71em")
        .style("text-anchor", "end")
        .style("fill", "black")
        .text("Literacy Rate (adult)");

    var city = svg.selectAll(".city")
                .data(cities)
                .enter().append("g")
                .attr("class","city");

    city.append("path")
        .attr("class","line_lit")
        .attr("d",function(d){
            return lineLit(d.values);
        })
        .style("stroke",function(d){
            return color(d.name)
        });

    city.append("text")
        .datum(function(d){
            return{
                name:d.name,
                value:d.values[d.values.length -1]
            };
        })
        .attr("transform",function(d){
            return "translate(" + scaleX(d.value.date)+","+scaleY(d.value.temperature)+")";
        })
        .attr("x",3)
        .attr("dy",".35")
        .text(function(d){
            return d.name;
        });

    var mouseG = svg.append("g") // this the black vertical line to folow mouse
                    .attr("class","mouse-over-effects");

    mouseG.append("path")
        .attr("class","mouse-line")
        .style("stroke","black")
        .style("stroke-width","1px")
        .style("opacity","0");

    var lines = document.getElementsByClassName("line_lit");
    var mousePerLine = mouseG.selectAll(".mouse-per-line")
    .data(cities)
    .enter()
    .append("g")
    .attr("class","mouse-per-line");

    mousePerLine.append("circle")
                .attr("r", 3)
                .style("stroke", function(d){
                    return color(d.name);
                })
                .style("fill", function(d){
                    return color(d.name);
                })
                .style("stroke-width", "1px")
                .style("opacity", "0");

    mousePerLine.append("text")
                .attr("transform", "translate(10, -8)");

    mouseG.append("rect")
        .attr("width",w_lit)
        .attr("height",h_lit)
        .attr("fill","none")
        .attr("pointer-events","all")
        .on("mouseout",function(){
            d3.select(".mouse-line").style("opacity","0");
            d3.selectAll(".mouse-per-line circle").style("opacity","0");
            d3.selectAll(".mouse-per-line text").style("opacity","0")
        })
        .on("mouseover",function(){
            d3.select(".mouse-line").style("opacity","1");
            d3.selectAll(".mouse-per-line circle").style("opacity","1");
            d3.selectAll(".mouse-per-line text").style("opacity","1")
        })
        .on("mousemove",function(){
            var mouse = d3.mouse(this);

            d3.select(".mouse-line")
            .attr("d",function(){
                    var d = "M" + mouse[0] +"," + h_lit;
                    d+=" " +mouse[0] + "," + 0;
                    return d;
            })
    
            d3.selectAll(".mouse-per-line")
                .attr("transform",function(d,i){
                        var xDate = scaleX.invert(mouse[0]),
                        bisect =d3.bisector(function(d){ return d.date;}).right;
                        idx = bisect(d.values,xDate);

                        var beginning = 0,
                        end = lines[i].getTotalLength(),
                        target = null;

                        while(true){
                            target = Math.floor((beginning+end)/2)
                            pos = lines[i].getPointAtLength(target);
                            if ((target ===end || target == beginning) && pos.x !==mouse[0]){
                                break;
                            }
                            if (pos.x > mouse[0]) 
                                end = target;
                            else if(pos.x < mouse[0]) 
                                beginning = target;
                            else 
                                break; // position found
                        }
                        d3.select(this).select("text")
                            .text(scaleY.invert(pos.y).toFixed(1))
                            .attr("fill",function(d){
                                return color(d.name)
                            });
                        return "translate(" +mouse[0]+","+pos.y+")";
                    }
                );
            }
        );
}); 