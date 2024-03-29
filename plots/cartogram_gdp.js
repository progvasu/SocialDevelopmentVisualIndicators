const cartogram = Cartogram()
            .valFormatter(d3.format('$,.0f'))
            (document.getElementById('world-cart'));
    
        d3.json('./data/world_topology_final.json', (error, world) => {
            if (error) throw error;
    
            var low = 2000;
            years = []
            for(var i = 0;i <= 2018-2000;i++) {
                years.push(low+i);
            }
 
            var sliderStep = d3
                .sliderBottom()
                .min(d3.min(years))
                .max(d3.max(years))
                .width(document.body.clientWidth-150)
                .ticks(18)
                .tickFormat(d3.format('d'))
                .step(1)
                .on('onchange', val => {
                    genVals(val);
                });

            var gStep = d3
                .select('div#slider-step-gdp')
                .append('svg')
                .attr('width', "100%")
                .attr('height', 80)
                .append('g')
                .attr('transform', 'translate(60,30)');
 
            gStep.call(sliderStep);

            // exclude antarctica
            world.objects.countries.geometries.splice(
                world.objects.countries.geometries.findIndex(d => d.properties.ISO_A2 === 'AQ'),
                1
            );

            const colorScale = d3.scaleSequential(d3.interpolatePlasma)
                .domain([1000, 3000000]);
    
            let ccData;
    
            cartogram
                .topoJson(world)
                .topoObjectName('countries')
                .width("100%")
                .value(({ properties: { ISO_A2 } }) => ccData[ISO_A2])
                .color(({ properties: { ISO_A2 } }) => colorScale(ccData[ISO_A2]))
                .label(({ properties: p }) => `${p.NAME} (${p.ISO_A2})`)
                .units(' million')
                .onClick(d => console.info(d));
    
            genVals(2000);
    
            function genVals(year) {
                ccData = Object
                    .assign(...world.objects.countries.geometries
                    .map(({ properties: { ISO_A2,GDP_MD_EST } }) => {
                            var val2 = GDP_MD_EST[year-2000] / 1000000;
                            if (val2 == 0) val2 = 1000
                            return ({ [ISO_A2]: val2 })
                        }));
                render();
            }

            function render() {
                cartogram.iterations(40);
            }
        });