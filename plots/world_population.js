function world_map() {
 
  var color, contents, graticule, height, lod, path, projection, radius, svg, width, zoom, zoomable_layer;

  svg = d3.select("#world");
  // svg.selectAll("*").remove();

  width = document.body.clientWidth;
height = document.body.clientHeight;

  zoomable_layer = svg.append('g');

  zoom = d3.zoom().scaleExtent([-Infinity, Infinity]).on('zoom', function() {
    zoomable_layer.attrs({
      transform: d3.event.transform
    });
    zoomable_layer.selectAll('.label > text').attrs({
      transform: "scale(" + (1 / d3.event.transform.k) + ")"
    });
    return lod(d3.event.transform.k);
  });

  svg.call(zoom);

  projection = d3.geoWinkel3().rotate([0, 0]).center([0, 0]).scale((width - 3) / (2 * Math.PI)).translate([width / 2, height / 2]);

  path = d3.geoPath(projection);

  graticule = d3.geoGraticule();

  radius = d3.scaleSqrt().range([0, 50]);

  color = d3.scaleOrdinal(d3.schemeCategory10).domain(['North America', 'Africa', 'South America', 'Asia', 'Europe', 'Oceania']);

  zoomable_layer.append('path').datum(graticule.outline()).attrs({
    "class": 'sphere_fill',
    d: path
  });

  contents = zoomable_layer.append('g');

  zoomable_layer.append('path').datum(graticule).attrs({
    "class": 'graticule',
    d: path
  });

  zoomable_layer.append('path').datum(graticule.outline()).attrs({
    "class": 'sphere_stroke',
    d: path
  });

var low = 2000;
years = []
for(var i = 0;i <= 2018-2000;i++) {
  years.push(low+i);
}

var sliderStep = d3
.sliderBottom()
.min(d3.min(years))
.max(d3.max(years))
.width(document.body.clientWidth-160)
.ticks(18)
.tickFormat(d3.format('d'))
.step(1)
.on('onchange', val => {
  //console.log(val);
  //d3.select('p#value-step').text((val));
update(val);
});

var gStep = d3
.select('#slider-step')
.append('svg')
.attr('width', "100%")
.attr('height', 100)
.append('g')
.attr('transform', 'translate(60,30)');

gStep.call(sliderStep);

update(2000);
  function update(year) {

    // console.log(year);
    // clear
    d3.select('#world').html("");
    d3.select('#play').html("");
    svg = d3.select("#world")
    .attr('width', "100%")
.attr('height', 800);
    zoomable_layer = svg.append('g');

  zoom = d3.zoom().scaleExtent([-Infinity, Infinity]).on('zoom', function() {
    zoomable_layer.attrs({
      transform: d3.event.transform
    });
    zoomable_layer.selectAll('.label > text').attrs({
      transform: "scale(" + (1 / d3.event.transform.k) + ")"
    });
    return lod(d3.event.transform.k);
  });

  svg.call(zoom);

  projection = d3.geoWinkel3().rotate([0, 0]).center([0, 0]).scale((width - 250) / (2 * Math.PI)).translate([width / 2, 600 / 2]);

  path = d3.geoPath(projection);

  graticule = d3.geoGraticule();

  radius = d3.scaleSqrt().range([0, 50]);

  color = d3.scaleOrdinal(d3.schemeCategory10).domain(['North America', 'Africa', 'South America', 'Asia', 'Europe', 'Oceania']);

  zoomable_layer.append('path').datum(graticule.outline()).attrs({
    "class": 'sphere_fill',
    d: path
  });

  contents = zoomable_layer.append('g');

  zoomable_layer.append('path').datum(graticule).attrs({
    "class": 'graticule',
    d: path
  });

  zoomable_layer.append('path').datum(graticule.outline()).attrs({
    "class": 'sphere_stroke',
    d: path
  });



  d3.json('./data/ne_50m_admin_0_countries.topo.json', function(geo_data) {
    var countries, countries_data, en_countries, en_labels, labels, labels_data;
    countries_data = topojson.feature(geo_data, geo_data.objects.countries).features;
    labels_data = [];
    countries_data.forEach(function(d) {
      var subpolys;
      if (d.geometry.type === 'Polygon') {
        d.area = d3.geoArea(d);
        d.main = d;
        return labels_data.push(d);
      } else if (d.geometry.type === 'MultiPolygon') {
        subpolys = [];
        d.geometry.coordinates.forEach(function(p) {
          var sp;
          sp = {
            coordinates: p,
            properties: d.properties,
            type: 'Polygon'
          };
          sp.area = d3.geoArea(sp);
          return subpolys.push(sp);
        });
        d.main = subpolys.reduce((function(a, b) {
          if (a.area > b.area) {
            return a;
          } else {
            return b;
          }
        }), subpolys[0]);
        return labels_data = labels_data.concat(subpolys);
      }
    });


    countries = contents.selectAll('.country').data(countries_data);
    en_countries = countries.enter().append('path').attrs({
      "class": 'country',
      d: path
    });
    labels = contents.selectAll('.label').data(labels_data);
    en_labels = labels.enter().append('g').attrs({
      "class": 'label',
      transform: function(d) {
        var ref, x, y;
        ref = projection(d3.geoCentroid(d)), x = ref[0], y = ref[1];
        return "translate(" + x + "," + y + ")";
      }
    });
    en_labels.classed('no_iso_code', function(d) {
      return d.properties.iso_a2 === '-99';
    });
    en_labels.append('text').text(function(d) {
      return d.properties.name_long;
    }).attrs({
      dy: '0.35em'
    });
    lod(1);

// changes

//update(1995);

    
    return d3.csv('./data/world_population.csv', function(data) {
      var bubbles, en_bubbles, index, population_data;
      index = {};
      data.forEach(function(d) {
        return index[d['Country Code']] = d;
      });

      // console.log(year);

      population_data = [];
      countries_data.forEach(function(d) {
        if (d.properties.iso_a3 in index) {
          return population_data.push({
            
            country: d,
            value: +index[d.properties.iso_a3][year]
          });
        }
      })
      //  console.log(population_data[0].country);
        //onsole.log(population_data[0].value);

      radius.domain([
        0, d3.max(population_data, function(d) {
          //console.log(d.value);
          return d.value;
        })
      ]);
      population_data.sort(function(a, b) {
        return d3.descending(a.value, b.value);
      });

      bubbles = contents.selectAll('.bubble').data(population_data);
      
      en_bubbles = bubbles.enter().append('circle').attrs({
        "class": 'bubble',
        fill: function(d) {
          return color(d.country.properties.continent);
        },
        r: function(d) {
          //console.log(radius(d.value));
          return radius(d.value);
        },
        transform: function(d) {
          var ref, x, y;
          ref = projection(d3.geoCentroid(d.country.main)), x = ref[0], y = ref[1];
          return "translate(" + x + "," + y + ")";
        }
      });
      return en_bubbles.append('title').text(function(d) {
        // console.log(d.value);
        return d.country.properties.name_long + "\nPopulation: " + (d3.format(',')(d.value));
      });
    });

 

  })
};


  lod = function(z) {
    return zoomable_layer.selectAll('.label').classed('hidden', function(d) {
      return d.area < Math.pow(0.2 / z, 2);
    });
  };

};

 world_map();

// 


// world_map(years[0]);
// d3.select('p#value-step').text((sliderStep.value()));
