//Desarrollo de las visualizaciones
import * as d3 from 'd3';
require('./sellect');
import { numberWithCommas2 } from '../helpers';
//import { getInTooltip, getOutTooltip, positionTooltip } from './modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage, setCustomCanvas, setChartCustomCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C', 
COLOR_PRIMARY_2 = '#E37A42', 
COLOR_ANAG_1 = '#D1834F', 
COLOR_ANAG_2 = '#BF2727', 
COLOR_COMP_1 = '#528FAD', 
COLOR_COMP_2 = '#AADCE0', 
COLOR_GREY_1 = '#B5ABA4', 
COLOR_GREY_2 = '#64605A', 
COLOR_OTHER_1 = '#B58753', 
COLOR_OTHER_2 = '#731854';

export function initChart(iframe) {
    //Creación de otros elementos relativos al gráfico que no requieran lectura previa de datos > Selectores múltiples o simples, timelines, etc 

    //Lectura de datos
    d3.csv('https://raw.githubusercontent.com/CarlosMunozDiazCSIC/informe_perfil_mayores_2022_demografia_1_2/main/data/piramide_21_urbano_rural_absolutos_v2.csv', function(error,data) {
        if (error) throw error;

        //SELECCIÓN DE ELEMENTOS
        let mySellect = sellect("#my-element", {
            originList: ['nacional','urbano','rural'],
            destinationList: ['urbano','rural'],
            onInsert: onChange,
            onRemove: onChange
        });

        function onChange() {
            let selectedArr = mySellect.getSelected();
            setPyramids(selectedArr);
        }

        mySellect.init();

        /////////////////VISUALIZACIÓN DE PIRÁMIDES///////////////

        ///Dividir los datos
        let dataUrbano = data.filter(function(item) { if (item.Tipo == 'espana_urbana') { return item; }});
        let dataRural = data.filter(function(item) { if (item.Tipo == 'espana_rural') { return item; }});
        let dataNacional = data.filter(function(item) { if (item.Tipo == 'nacional') { return item; }});

        ///Valores iniciales de altura, anchura y márgenes > Primer desarrollo solo con valores absolutos
        let margin = {top: 20, right: 30, bottom: 40, left: 70},
            width = document.getElementById('chart').clientWidth - margin.left - margin.right,
            height = document.getElementById('chart').clientHeight - margin.top - margin.bottom;

        let svg = d3.select("#chart")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        let x = d3.scaleLinear()
            .domain([-600000,600000])
            .range([0,width]);

        let xM = d3.scaleLinear()
            .domain([600000,0])
            .range([0, width / 2]);

        let xF = d3.scaleLinear()
            .domain([0,600000])
            .range([width / 2, width]);

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        let y = d3.scaleBand()
                .range([ 0, height ])
                .domain(d3.range(101).reverse())
                .padding(.1);

        svg.append("g")
            .call(d3.axisLeft(y));

        function initPyramid() { //Pirámides urbano vs rural

            //Urbana
            svg.append("g")
                .selectAll("rect")
                .data(dataUrbano)
                .enter()
                .append("rect")
                .attr('class', 'prueba')
                .attr("fill", function(d) { if(d.sexo == 'Hombres') { return COLOR_PRIMARY_1; } else { return COLOR_COMP_1; }})
                .style('opacity', '0.9')
                .attr("x", function(d) { if(d.sexo == 'Hombres') { return xM(d.valor); } else { return xF(0); }})
                .attr("y", function(d) { return y(d.edades); })
                .attr("width", function(d) { if(d.sexo == 'Hombres') { return xM(0) - xM(d.valor); } else { return xF(d.valor) - xF(0); }})
                .attr("height", y.bandwidth());

            //Rural
            svg.append("g")
                .selectAll("rect")
                .data(dataRural)
                .enter()
                .append("rect")
                .attr('class', 'prueba')
                .attr("fill", function(d) { if(d.sexo == 'Hombres') { return COLOR_PRIMARY_1; } else { return COLOR_COMP_1; }})
                .style('opacity', '0.6')
                .attr("x", function(d) { if(d.sexo == 'Hombres') { return xM(d.valor); } else { return xF(0); }})
                .attr("y", function(d) { return y(d.edades); })
                .attr("width", function(d) { if(d.sexo == 'Hombres') { return xM(0) - xM(d.valor); } else { return xF(d.valor) - xF(0); }})
                .attr("height", y.bandwidth());

        }

        function setPyramids(types) {
            console.log(types);
        }

        ////////////
        ////////////RESTO
        ////////////
        initPyramid();

        //Animación del gráfico
        document.getElementById('replay').addEventListener('click', function() {
            animateChart();
        });

        //Iframe
        setFixedIframeUrl('informe_perfil_mayores_2022_demografia_1_2','comparativa_piramides_espana_rural');

        //Redes sociales > Antes tenemos que indicar cuál sería el texto a enviar
        setRRSSLinks('comparativa_piramides_espana_rural');

        //Captura de pantalla de la visualización
        setChartCanvas();
        setCustomCanvas();

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            setChartCanvasImage('comparativa_piramides_espana_rural');
            setChartCustomCanvasImage('comparativa_piramides_espana_rural');
        });

        //Altura del frame
        setChartHeight(iframe);
    });    
}