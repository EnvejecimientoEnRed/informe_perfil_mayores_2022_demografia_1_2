//Desarrollo de las visualizaciones
import * as d3 from 'd3';
require('./sellect');
import { numberWithCommas3 } from '../helpers';
import { getInTooltip, getOutTooltip, positionTooltip } from '../modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C', 
COLOR_PRIMARY_2 = '#E37A42',
COLOR_COMP_1 = '#528FAD', 
COLOR_COMP_2 = '#AADCE0',
COLOR_GREY_1 = '#D6D6D6', 
COLOR_GREY_2 = '#A3A3A3',
COLOR_ANAG__PRIM_1 = '#BA9D5F', 
COLOR_ANAG_PRIM_2 = '#9E6C51',
COLOR_ANAG_PRIM_3 = '#9E3515',
COLOR_ANAG_COMP_1 = '#1C5A5E';
let tooltip = d3.select('#tooltip');

export function initChart() {
    //Creación de otros elementos relativos al gráfico que no requieran lectura previa de datos > Selectores múltiples o simples, timelines, etc 

    //Lectura de datos
    d3.csv('https://raw.githubusercontent.com/EnvejecimientoEnRed/informe_perfil_mayores_2022_demografia_1_2/main/data/piramide_2021_urbano_rural.csv', function(error,data) {
        if (error) throw error;

        //SELECCIÓN DE ELEMENTOS
        let selectedArr = ['Nacional'];
        let mySellect = sellect("#my-element", {
            originList: ['Nacional','Urbana','Rural'],
            destinationList: ['Nacional'],
            onInsert: onChange,
            onRemove: onChange
        });

        function onChange() {
            selectedArr = mySellect.getSelected();
            setPyramids(selectedArr);
        }

        mySellect.init();

        /////////////////VISUALIZACIÓN DE PIRÁMIDES///////////////

        ///Dividir los datos
        let currentType = 'porcentajes';
        let dataAbsolutoUrbano = data.filter(function(item) { if (item.Tipo == 'espana_urbana' && item.Data == 'Absolutos') { return item; }});
        let dataAbsolutoRural = data.filter(function(item) { if (item.Tipo == 'espana_rural' && item.Data == 'Absolutos') { return item; }});
        let dataAbsolutoNacional = data.filter(function(item) { if (item.Tipo == 'nacional' && item.Data == 'Absolutos') { return item; }});
        let dataRelativoUrbano = data.filter(function(item) { if (item.Tipo == 'espana_urbana' && item.Data == 'Porcentajes') { return item; }});
        let dataRelativoRural = data.filter(function(item) { if (item.Tipo == 'espana_rural' && item.Data == 'Porcentajes') { return item; }});
        let dataRelativoNacional = data.filter(function(item) { if (item.Tipo == 'nacional' && item.Data == 'Porcentajes') { return item; }});

        ///Valores iniciales de altura, anchura y márgenes > Primer desarrollo solo con Valores absolutos
        let margin = {top: 12.5, right: 25, bottom: 25, left: 70},
            width = document.getElementById('chart').clientWidth - margin.left - margin.right,
            auxHeight = width * 0.67 - margin.top - margin.bottom,
            height = auxHeight < 180 ? 180 : auxHeight;

        let svg = d3.select("#chart")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        let x = d3.scaleLinear()
            .domain([-1,1])
            .range([0,width]);

        let xM = d3.scaleLinear()
            .domain([1,0])
            .range([0, width / 2]);

        let xF = d3.scaleLinear()
            .domain([0,1])
            .range([width / 2, width]);

        let xAxis = function(svg) {
            svg.call(d3.axisBottom(x).ticks(6).tickFormat(function(d) { return numberWithCommas3(Math.abs(d)); }));
            svg.call(function(g){
                g.selectAll('.tick line')
                    .attr('class', function(d,i) {
                        if (d == 0) {
                            return 'line-special';
                        }
                    })
                    .attr('y1', '0')
                    .attr('y2', `-${height}`)
            });
        }

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr('class','x-axis')
            .call(xAxis);

        let y = d3.scaleBand()
            .range([ 0, height ])
            .domain(dataAbsolutoUrbano.map(function(item) { return item.Edad; }).reverse())
            .padding(.1);

        let yAxis = function(svg) {
            svg.call(d3.axisLeft(y).tickValues(y.domain().filter(function(d,i){ return !(i%10)})));
            svg.call(function(g){g.selectAll('.tick line').remove()});
        }

        svg.append("g")
            .call(yAxis);

        function initPyramid() {
            //Nacional
            svg.append("g")
                .attr('class', 'chart-g')
                .selectAll("rect")
                .data(dataRelativoNacional)
                .enter()
                .append("rect")
                .attr('class', 'prueba')
                .attr("fill", "transparent")
                .attr("stroke", COLOR_ANAG_PRIM_3)
                .attr("x", x(0))
                .attr("y", function(d) { return y(d.Edad); })
                .attr("width", 0)
                .attr("height", y.bandwidth())
                .on('mouseover', function(d,i,e) {
                    //Dibujo contorno de la rect
                    this.style.strokeWidth = '2';

                    //Texto en tooltip
                    let html = '<p class="chart__tooltip--title">' + d.Sexo + ' (' + d.Edad + ' años) en España en general</p>' + 
                        '<p class="chart__tooltip--text">% sobre total de la España en general: ' + numberWithCommas3(parseFloat(d.Valor))+ '%</p>';
                
                    tooltip.html(html);

                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);
                })
                .on('mouseout', function(d,i,e) {
                    //Fuera contorno
                    this.style.strokeWidth = '1';

                    //Fuera tooltip
                    getOutTooltip(tooltip);
                })
                .transition()
                .duration(2000)
                .attr("x", function(d) { if(d.Sexo == 'Hombres') { return xM(d.Valor); } else { return xF(0); }})
                .attr('width', function(d) { if(d.Sexo == 'Hombres') { return xM(0) - xM(d.Valor); } else { return xF(d.Valor) - xF(0); }});

            // //Rural
            // svg.append("g")
            //     .attr('class', 'chart-g')
            //     .selectAll("rect")
            //     .data(dataRelativoRural)
            //     .enter()
            //     .append("rect")
            //     .attr('class', 'prueba')
            //     .attr("fill", COLOR_PRIMARY_1)
            //     .style('opacity', '0.8')
            //     .attr("x", x(0))
            //     .attr("y", function(d) { return y(d.Edad); })
            //     .attr("width", 0)
            //     .attr("height", y.bandwidth())
            //     .on('mouseover', function(d,i,e) {
            //         //Dibujo contorno de la rect
            //         this.style.stroke = '#000';
            //         this.style.strokeWidth = '1';

            //         //Texto en tooltip
            //         let html = '<p class="chart__tooltip--title">' + d.Sexo + ' (' + d.Edad + ' años) en España rural</p>' + 
            //             '<p class="chart__tooltip--text">% sobre total de la España rural: <b>' + numberWithCommas3(parseFloat(d.Valor))+ '%</b></p>';
                
            //         tooltip.html(html);

            //         //Tooltip
            //         positionTooltip(window.event, tooltip);
            //         getInTooltip(tooltip);
            //     })
            //     .on('mouseout', function(d,i,e) {
            //         //Fuera contorno
            //         this.style.stroke = 'none';
            //         this.style.strokeWidth = '0';

            //         //Fuera tooltip
            //         getOutTooltip(tooltip);
            //     })
            //     .transition()
            //     .duration(2000)
            //     .attr("x", function(d) { if(d.Sexo == 'Hombres') { return xM(d.Valor); } else { return xF(0); }})
            //     .attr('width', function(d) { if(d.Sexo == 'Hombres') { return xM(0) - xM(d.Valor); } else { return xF(d.Valor) - xF(0); }});
            
            // //Urbana
            // svg.append("g")
            //     .attr('class', 'chart-g')
            //     .selectAll("rect")
            //     .data(dataRelativoUrbano)
            //     .enter()
            //     .append("rect")
            //     .attr('class', 'prueba')
            //     .attr("fill", COLOR_COMP_1)
            //     .style('opacity', '0.8')
            //     .attr("x", x(0))
            //     .attr("y", function(d) { return y(d.Edad); })
            //     .attr("width", 0)
            //     .attr("height", y.bandwidth())
            //     .on('mouseover', function(d,i,e) {
            //         //Dibujo contorno de la rect
            //         this.style.stroke = '#000';
            //         this.style.strokeWidth = '1';

            //         //Texto en tooltip
            //         let html = '<p class="chart__tooltip--title">' + d.Sexo + ' (' + d.Edad + ' años) en España urbana</p>' + 
            //             '<p class="chart__tooltip--text">% sobre total de la España urbana: <b>' + numberWithCommas3(parseFloat(d.Valor))+ '%</b></p>';
                
            //         tooltip.html(html);

            //         //Tooltip
            //         positionTooltip(window.event, tooltip);
            //         getInTooltip(tooltip);
            //     })
            //     .on('mouseout', function(d,i,e) {
            //         //Fuera contorno
            //         this.style.stroke = 'none';
            //         this.style.strokeWidth = '0';

            //         //Fuera tooltip
            //         getOutTooltip(tooltip);
            //     })
            //     .transition()
            //     .duration(2000)
            //     .attr("x", function(d) { if(d.Sexo == 'Hombres') { return xM(d.Valor); } else { return xF(0); }})
            //     .attr('width', function(d) { if(d.Sexo == 'Hombres') { return xM(0) - xM(d.Valor); } else { return xF(d.Valor) - xF(0); }});
        }

        function setPyramids(types) {
            svg.selectAll('.chart-g')
                .remove();

            if(currentType == 'absolutos') {

                x.domain([-500000,500000]);
                svg.select(".x-axis").call(xAxis);                
                xM.domain([500000,0]);
                xF.domain([0,500000]);

                for(let i = types.length - 1; i >= 0; i--) {

                    if(types[i] == 'Rural'){
                        svg.append("g")
                            .attr('class', 'chart-g')
                            .selectAll("rect")
                            .data(dataAbsolutoRural)
                            .enter()
                            .append("rect")
                            .attr('class', 'prueba')
                            .attr("fill", COLOR_PRIMARY_1)
                            .attr("x", x(0))
                            .attr("y", function(d) { return y(d.Edad); })
                            .attr("width", 0)
                            .attr("height", y.bandwidth())
                            .on('mouseover', function(d,i,e) {
                                //Dibujo contorno de la rect
                                this.style.stroke = '#000';
                                this.style.strokeWidth = '1';
            
                                //Texto en tooltip
                                let html = '<p class="chart__tooltip--title">' + d.Sexo + ' (' + d.Edad + ' años) en España rural</p>' + 
                                    '<p class="chart__tooltip--text">Número absoluto de personas: <b>' + numberWithCommas3(parseFloat(d.Valor))+ '</b></p>';
                            
                                tooltip.html(html);
            
                                //Tooltip
                                positionTooltip(window.event, tooltip);
                                getInTooltip(tooltip);
                            })
                            .on('mouseout', function(d,i,e) {
                                //Fuera contorno
                                this.style.stroke = 'none';
                                this.style.strokeWidth = '0';
            
                                //Fuera tooltip
                                getOutTooltip(tooltip);
                            })
                            .transition()
                            .duration(2000)
                            .attr("x", function(d) { if(d.Sexo == 'Hombres') { return xM(d.Valor); } else { return xF(0); }})
                            .attr('width', function(d) { if(d.Sexo == 'Hombres') { return xM(0) - xM(d.Valor); } else { return xF(d.Valor) - xF(0); }});
                    }

                    if(types[i] == 'Urbana') {
                        svg.append("g")
                            .attr('class', 'chart-g')
                            .selectAll("rect")
                            .data(dataAbsolutoUrbano)
                            .enter()
                            .append("rect")
                            .attr('class', 'prueba')
                            .attr("fill", COLOR_COMP_1)
                            .attr("x", x(0))
                            .attr("y", function(d) { return y(d.Edad); })
                            .attr("width", 0)
                            .attr("height", y.bandwidth())
                            .on('mouseover', function(d,i,e) {
                                //Dibujo contorno de la rect
                                this.style.stroke = '#000';
                                this.style.strokeWidth = '1';
            
                                //Texto en tooltip
                                let html = '<p class="chart__tooltip--title">' + d.Sexo + ' (' + d.Edad + ' años) en España urbana</p>' + 
                                    '<p class="chart__tooltip--text">Número absoluto de personas: <b>' + numberWithCommas3(parseFloat(d.Valor))+ '</b></p>';
                            
                                tooltip.html(html);
            
                                //Tooltip
                                positionTooltip(window.event, tooltip);
                                getInTooltip(tooltip);
                            })
                            .on('mouseout', function(d,i,e) {
                                //Fuera contorno
                                this.style.stroke = 'none';
                                this.style.strokeWidth = '0';
            
                                //Fuera tooltip
                                getOutTooltip(tooltip);
                            })
                            .transition()
                            .duration(2000)
                            .attr("x", function(d) { if(d.Sexo == 'Hombres') { return xM(d.Valor); } else { return xF(0); }})
                            .attr('width', function(d) { if(d.Sexo == 'Hombres') { return xM(0) - xM(d.Valor); } else { return xF(d.Valor) - xF(0); }});
                    }               
    
                    if(types[i] == 'Nacional') {
                        svg.append("g")
                            .attr('class', 'chart-g')
                            .selectAll("rect")
                            .data(dataAbsolutoNacional)
                            .enter()
                            .append("rect")
                            .attr('class', 'prueba')
                            .attr("fill", "transparent")
                            .attr("stroke", COLOR_ANAG_PRIM_3)
                            .attr("x", x(0))
                            .attr("y", function(d) { return y(d.Edad); })
                            .attr("width", 0)
                            .attr("height", y.bandwidth())
                            .on('mouseover', function(d,i,e) {
                                //Dibujo contorno de la rect
                                this.style.strokeWidth = '2';
            
                                //Texto en tooltip
                                let html = '<p class="chart__tooltip--title">' + d.Sexo + ' (' + d.Edad + ' años) en España en general</p>' + 
                                    '<p class="chart__tooltip--text">Número absoluto de personas: <b>' + numberWithCommas3(parseFloat(d.Valor))+ '</b></p>';
                            
                                tooltip.html(html);
            
                                //Tooltip
                                positionTooltip(window.event, tooltip);
                                getInTooltip(tooltip);
                            })
                            .on('mouseout', function(d,i,e) {
                                //Fuera contorno
                                this.style.strokeWidth = '1';
            
                                //Fuera tooltip
                                getOutTooltip(tooltip);
                            })
                            .transition()
                            .duration(2000)
                            .attr("x", function(d) { if(d.Sexo == 'Hombres') { return xM(d.Valor); } else { return xF(0); }})
                            .attr('width', function(d) { if(d.Sexo == 'Hombres') { return xM(0) - xM(d.Valor); } else { return xF(d.Valor) - xF(0); }});
                    }
                }                

            } else {

                x.domain([-1,1]);
                svg.select(".x-axis").call(xAxis);
                xM.domain([1,0]);
                xF.domain([0,1]);

                for(let i = types.length - 1; i >= 0; i--) {

                    if(types[i] == 'Rural') {
                        svg.append("g")
                            .attr('class', 'chart-g')
                            .selectAll("rect")
                            .data(dataRelativoRural)
                            .enter()
                            .append("rect")
                            .attr('class', 'prueba')
                            .attr("fill", COLOR_PRIMARY_1)
                            .attr("x", x(0))
                            .attr("y", function(d) { return y(d.Edad); })
                            .attr("width", 0)
                            .attr("height", y.bandwidth())
                            .on('mouseover', function(d,i,e) {
                                //Dibujo contorno de la rect
                                this.style.stroke = '#000';
                                this.style.strokeWidth = '1';
            
                                //Texto en tooltip
                                let html = '<p class="chart__tooltip--title">' + d.Sexo + ' (' + d.Edad + ' años) en España rural</p>' + 
                                    '<p class="chart__tooltip--text">% sobre total de la España rural: ' + numberWithCommas3(parseFloat(d.Valor))+ '%</p>';
                            
                                tooltip.html(html);
            
                                //Tooltip
                                positionTooltip(window.event, tooltip);
                                getInTooltip(tooltip);
                            })
                            .on('mouseout', function(d,i,e) {
                                //Fuera contorno
                                this.style.stroke = 'none';
                                this.style.strokeWidth = '0';
            
                                //Fuera tooltip
                                getOutTooltip(tooltip);
                            })
                            .transition()
                            .duration(2000)
                            .attr("x", function(d) { if(d.Sexo == 'Hombres') { return xM(d.Valor); } else { return xF(0); }})
                            .attr('width', function(d) { if(d.Sexo == 'Hombres') { return xM(0) - xM(d.Valor); } else { return xF(d.Valor) - xF(0); }});
                    }
    
                    if(types[i] == 'Urbana') {
                        svg.append("g")
                            .attr('class', 'chart-g')
                            .selectAll("rect")
                            .data(dataRelativoUrbano)
                            .enter()
                            .append("rect")
                            .attr('class', 'prueba')
                            .attr("fill", COLOR_COMP_1)
                            .attr("x", x(0))
                            .attr("y", function(d) { return y(d.Edad); })
                            .attr("width", 0)
                            .attr("height", y.bandwidth())
                            .on('mouseover', function(d,i,e) {
                                //Dibujo contorno de la rect
                                this.style.stroke = '#000';
                                this.style.strokeWidth = '1';
            
                                //Texto en tooltip
                                let html = '<p class="chart__tooltip--title">' + d.Sexo + ' (' + d.Edad + ' años) en España urbana</p>' + 
                                    '<p class="chart__tooltip--text">% sobre total de la España urbana: ' + numberWithCommas3(parseFloat(d.Valor))+ '%</p>';
                            
                                tooltip.html(html);
            
                                //Tooltip
                                positionTooltip(window.event, tooltip);
                                getInTooltip(tooltip);
                            })
                            .on('mouseout', function(d,i,e) {
                                //Fuera contorno
                                this.style.stroke = 'none';
                                this.style.strokeWidth = '0';
            
                                //Fuera tooltip
                                getOutTooltip(tooltip);
                            })
                            .transition()
                            .duration(2000)
                            .attr("x", function(d) { if(d.Sexo == 'Hombres') { return xM(d.Valor); } else { return xF(0); }})
                            .attr('width', function(d) { if(d.Sexo == 'Hombres') { return xM(0) - xM(d.Valor); } else { return xF(d.Valor) - xF(0); }});
                    }
    
                    if(types[i] == 'Nacional') {
                        svg.append("g")
                            .attr('class', 'chart-g')
                            .selectAll("rect")
                            .data(dataRelativoNacional)
                            .enter()
                            .append("rect")
                            .attr('class', 'prueba')
                            .attr("fill", "transparent")
                            .attr("stroke", COLOR_ANAG_PRIM_3)
                            .attr("x", x(0))
                            .attr("y", function(d) { return y(d.Edad); })
                            .attr("width", 0)
                            .attr("height", y.bandwidth())
                            .on('mouseover', function(d,i,e) {
                                //Dibujo contorno de la rect
                                this.style.strokeWidth = '2';
            
                                //Texto en tooltip
                                let html = '<p class="chart__tooltip--title">' + d.Sexo + ' (' + d.Edad + ' años) en España en general</p>' + 
                                    '<p class="chart__tooltip--text">% sobre total de la España en general: ' + numberWithCommas3(parseFloat(d.Valor))+ '%</p>';
                            
                                tooltip.html(html);
            
                                //Tooltip
                                positionTooltip(window.event, tooltip);
                                getInTooltip(tooltip);
                            })
                            .on('mouseout', function(d,i,e) {
                                //Fuera contorno
                                this.style.strokeWidth = '1';
            
                                //Fuera tooltip
                                getOutTooltip(tooltip);
                            })
                            .transition()
                            .duration(2000)
                            .attr("x", function(d) { if(d.Sexo == 'Hombres') { return xM(d.Valor); } else { return xF(0); }})
                            .attr('width', function(d) { if(d.Sexo == 'Hombres') { return xM(0) - xM(d.Valor); } else { return xF(d.Valor) - xF(0); }});
                    }
                }     
                
            }
        }

        ////////////
        ////////////RESTO
        ////////////
        initPyramid();

        //Uso de dos botones para ofrecer datos absolutos y en miles
        document.getElementById('data_absolutos').addEventListener('click', function() {
            //Cambiamos color botón
            document.getElementById('data_porcentajes').classList.remove('active');
            document.getElementById('data_absolutos').classList.add('active');

            //Cambio texto
            document.getElementById('texto-reactivo').textContent = 'Personas';

            //Cambiamos valor actual
            currentType = 'absolutos';

            //Cambiamos gráfico
            setPyramids(selectedArr);            
        });

        document.getElementById('data_porcentajes').addEventListener('click', function() {
            //Cambiamos color botón
            document.getElementById('data_porcentajes').classList.add('active');
            document.getElementById('data_absolutos').classList.remove('active');

            //Cambio texto
            document.getElementById('texto-reactivo').textContent = 'Porcentaje';

            //Cambiamos valor actual
            currentType = 'porcentajes';

            //Cambiamos gráfico
            setPyramids(selectedArr);            
        });

        //Animación del gráfico
        document.getElementById('replay').addEventListener('click', function() {
            setPyramids(selectedArr);
        });

        //Iframe
        setFixedIframeUrl('informe_perfil_mayores_2022_demografia_1_2','comparativa_piramides_espana_rural');

        //Redes sociales > Antes tenemos que indicar cuál sería el texto a enviar
        setRRSSLinks('comparativa_piramides_espana_rural');

        //Captura de pantalla de la visualización
        setChartCanvas();

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            setChartCanvasImage('comparativa_piramides_espana_rural');
        });

        //Altura del frame
        setChartHeight();
    });    
}