////////////////
//Global Var. //
////////////////

//var localPrefix = "http://localhost/";
var localPrefix = "";

var DATA_SRC1 = localPrefix + "data/CurrencyRate.json";
var DATA_SRC2 = localPrefix + "data/FinancialData.json";
var companyData;
var currencyData;
var langKey;
var playMode = "default";
var ANIMATION_TIME = 5*60*1000;
var nCompanies;
var startTime;
var elapseTime;
var dLabel;

var formatT0 = d3.format(".0f");
var formatT1 = d3.format(".1f");
var formatT2 = d3.format(".2f");
            
function setLangKey(_langKey){
    langKey = _langKey; //"Japan" or "English";
}

function setPlayMode(_modeKey){
    playMode = _modeKey;
}

queue()
.defer(d3.json, DATA_SRC1)
.defer(d3.json, DATA_SRC2)
.await(ready);


function ready(error, data1, data2) {

    ///////////////////
    // Initial func. //
    ///////////////////
    currencyData = data1;
    companyData = data2;

    function currency_rate(key, yIndex){    
        for (var i = 0; i < currencyData.length; i++)
            if (currencyData[i].currency == key)
                return currencyData[i].value[yIndex].rate;
    }
    
    var filterKey = "ALL";
    var visFlg = false;
    
    //value range
    nCompanies = companyData.length;
    var yearLength = companyData[0].revenue.length;
    var startYear = companyData[0].revenue[0][0];
    var nowYear = startYear;
    var nowYearG;
    var endYear = companyData[0].revenue[yearLength - 1][0];

    //currency setting
    for(var i=0; i<nCompanies; i++){
        for(var j=0; j<yearLength; j++){
            var _revenue = companyData[i].revenue[j][1];  //[Million USD]
            var _capital = companyData[i].capital[j][1];  //[Million USD]
            var _assets  = companyData[i].assets[j][1];   //[Million USD]
            var cRate, cDigit;
            switch(langKey){
                case "Japan":
                    //YEN
                    cRate = currency_rate("USD/YEN", j);
                    cDigit = 1e6;
                    dLabel = " (兆円)";
                    break;
                default:
                    //USD
                    cRate = 1.0;
                    cDigit = 1e3;
                    dLabel = " (B$)";
                    break;
            }
            companyData[i].revenue[j][1] = (_revenue / cRate) / cDigit;
            companyData[i].capital[j][1] = (_capital / cRate) / cDigit;
            companyData[i].assets[j][1]  = (_assets / cRate) / cDigit;
        }
    }

    //value limit
    var minRevenue = 0,
        maxRevenue = 0,
        minProfitRate = -0.1,
        maxProfitRate = 0,
        minCapital = 0,
        maxCapital = 0,
        minCapitalChangeRate = 0,
        maxCapitalChangeRate = 0;
    for(var i=0; i<nCompanies; i++){
        var minRevenue_tmp = getMinValue(companyData[i].revenue),
            maxRevenue_tmp = getMaxValue(companyData[i].revenue),
            minProfitRate_tmp = getMinValue(companyData[i].profitRate),
            maxProfitRate_tmp = getMaxValue(companyData[i].profitRate),
            minCapital_tmp = getMinValue(companyData[i].capital),
            maxCapital_tmp = getMaxValue(companyData[i].capital),
            minCapitalChangeRate_tmp = getMinValue(companyData[i].capital_changeRate),
            maxCapitalChangeRate_tmp = getMaxValue(companyData[i].capital_changeRate); 
        if(minRevenue > minRevenue_tmp) minRevenue = minRevenue_tmp;
        if(maxRevenue < maxRevenue_tmp) maxRevenue = maxRevenue_tmp;
        if(minProfitRate > minProfitRate_tmp) minProfitRate = minProfitRate_tmp;
        if(maxProfitRate < maxProfitRate_tmp) maxProfitRate = maxProfitRate_tmp;
        if(minCapital > minCapital_tmp) minCapital = minCapital_tmp;
        if(maxCapital < maxCapital_tmp) maxCapital = maxCapital_tmp;
        if(minCapitalChangeRate > minCapitalChangeRate_tmp) minCapitalChangeRate = minCapitalChangeRate_tmp;
        if(maxCapitalChangeRate < maxCapitalChangeRate_tmp) maxCapitalChangeRate = maxCapitalChangeRate_tmp;
    }
    
    function getMinValue(array) {
       var value_tmp = 0;
       var value_min = 0;
        for(var i=0; i<array.length; i++){
            value_tmp = array[i][1];
            if(value_min > value_tmp) value_min = value_tmp;
        }
        return value_min;
    }
    function getMaxValue(array) {
       var value_tmp = 0;
       var value_max = 0;
        for(var i=0; i<array.length; i++){
            value_tmp = array[i][1];
            if(value_max < value_tmp) value_max = value_tmp;
        }
        return value_max;
    }

    /////////////////////////////////////
    // Data - Visualize relation func. //
    /////////////////////////////////////
    //x axis : revenue
    function xValue(d) {
        return d.revenue;
    }
    //y axis : profit rate [%]
    function yValue(d) {
        return d.profitRate * 100;
    }
    //radius : market cap.
    function radius(d) {
        return d.capital;
    }
    //color  : capital_changeRate [%]
    function color(d) {
        return d.capital_changeRate * 100;
    }
    //key    : id
    function key(d) {
        return d.id;
    }
    //x2 axis : year
    function x2Value(d) {
        return d.year;
    }
    //y2 axis : market cap.
    function y2Value(d) {
        return d.capital;
    }
    //for label : total assets
    function assets(d) {
        return d.assets;        
    }
    //other : id
    function id(company_index) {
        return companyData[company_index].id;
    }
    //other : company no.
    function companyIndex(_id) {
        for ( i = 0; i < nCompanies; i++)
            if (companyData[i].id == _id)
                return i;
    }
    //other : company name
    function companyName(d) {
        return (langKey == "Japan") ? d.name_jp : d.id;
    }
    //other : yIndex
    function yearIndex(_year) {
        return (_year > endYear) ? endYear - startYear : _year - startYear;   
    }
    
    
    ////////////////////////
    // Element definition //
    ////////////////////////
    var margin = {
            top: 50,
            right: 200,
            bottom: 50,
            left: 50
        },
        width = 1400 - margin.right - margin.left,
        height = 576 - margin.top;
        t_height = 300 - margin.bottom; //タイムラインの高さ

    // Scalling
    var xScale = d3.scale.sqrt()
        .domain([0, maxRevenue])
        .range([0, width]);
    var yScale = d3.scale.sqrt()
        .domain([-0.1*100, maxProfitRate*100])
        .range([height, 0]);
    var tScale = d3.scale.linear()
        .domain([startYear, endYear])
        .range([0, width]);
    var cScale = d3.scale.sqrt()
        .domain([0, maxCapital])
        .range([t_height, 0]);
    var radiusScale = d3.scale.sqrt()
        .domain([0, maxCapital])
        .range([0, 100]);
    var colorScale = d3.scale.linear()
        .domain([-50, 50])
        .interpolate(d3.interpolateRgb)
        .range([d3.rgb(200, 0, 0), d3.rgb(0, 100, 200)]);

    // trace path
    var line = d3.svg.line()
        .x(function(d) { return xScale(xValue(d)); })
        .y(function(d) { return yScale(yValue(d)); });
    // market cap. chart
    var line2 = d3.svg.line()
        .x(function(d) { return tScale(x2Value(d));})
        .y(function(d) { return cScale(y2Value(d));});
    var area = d3.svg.area()
        .x(function(d) { return tScale(x2Value(d));})
        .y0(function(d) { return cScale(0);})
        .y1(function(d) { return cScale(y2Value(d));});
    
    // X,Y Axis
    var xAxis = d3.svg.axis()
            .orient("bottom")
            .scale(xScale)
            .ticks(12, d3.format(",d"))
            .innerTickSize(-height)
            .outerTickSize(0)
            .tickPadding(10);
    var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .innerTickSize(-width)
            .outerTickSize(0)
            .tickPadding(10);
    var tAxis = d3.svg.axis()
            .orient("bottom")
            .scale(tScale)
            //.tickValues([1981, 1985, 1990, 1995, 2000, 2005, 2010, 2015])
            .tickFormat(d3.format("04d"))
            .innerTickSize(-t_height)
            .outerTickSize(0)
            .tickPadding(5);
    var cAxis = d3.svg.axis()
            .scale(cScale)
            .orient("left")
            .innerTickSize(-width)
            .outerTickSize(0)
            .tickPadding(10);
    
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var timeline = d3.select("#TimeLine").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", t_height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //////////////////////////
    // Element registration //
    //////////////////////////
    
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    svg.append("line")
        .attr("class", "axisLine")
        .attr("y1", height)
        .attr("y2", height)
        .attr("x1", 0)
        .attr("x2", width);
    svg.append("line")
        .attr("class", "axisLine")
        .attr("y1", 0)
        .attr("y2", height)
        .attr("x1", 0)
        .attr("x2", 0);
    svg.append("line")
        .attr("y1",yScale(0))
        .attr("y2",yScale(0))
        .attr("x1",0)
        .attr("x2",width)
        .style("stroke","gray")
        .append("title").text("Zero line");
    var hanrei = svg.append("g")
        .attr("class", "hanrei")
        .attr("transform", "translate(" + margin.left + "," + (height - 110) + ")");
    hanrei.selectAll("circle")
        .data(function(d) { return (langKey == "Japan") ? [20,5,1] : [200,50,10]; })
        .enter().append("circle")
        .attr("class", "hanrei")
        .attr("cx", 50)
        .attr("cy", function(d) { return 100-radiusScale(d); })
        .attr("r", function(d) { return radiusScale(d); });
    hanrei.selectAll("text")
        .data(function(d) { return (langKey == "Japan") ? [20,5,1] : [200,50,10]; })
        .enter().append("text")
        .attr("class", "hanrei")
        .attr("x", 50)
        .attr("y", function(d){ return 100-radiusScale(d)*2;})
        .attr("dy", "-0.5em")
        .text(function(d){ return d + dLabel; })
        .text(function(d){ return d + dLabel; })
        .style("text-anchor", "middle");
    timeline.append("g")
        .attr("class", "c axis")
        .call(cAxis);
    timeline.append("line")
        .attr("class", "axisLine")
        .attr("y1", t_height)
        .attr("y2", t_height)
        .attr("x1", 0)
        .attr("x2", width);
    timeline.append("line")
        .attr("class", "axisLine")
        .attr("y1", 0)
        .attr("y2", t_height)
        .attr("x1", 0)
        .attr("x2", 0);
    timeline.append("g")
        .attr("class", "t axis")
        .attr("transform", "translate(0," + t_height + ")")
        .call(tAxis);
    timeline.append("text")
        .attr("class", "t label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", t_height - 10)
        .text("年");
    var gradient = timeline.append("svg:defs")
        .append("svg:linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");
    gradient.append("svg:stop")
        .attr("offset", "0%")
        .attr("stop-color", "#4682b4")
        .attr("stop-opacity", 1);
    gradient.append("svg:stop")
        .attr("offset", "100%")
        .attr("stop-color", "#4682b4")
        .attr("stop-opacity", 0);
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text(function(d){return ((langKey == "Japan") ? "売上高" : "Revenue") + dLabel;});
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text(function(d){return ((langKey == "Japan") ? "営業利益率" : "Profit Rate") + " (%)";});
    timeline.append("text")
        .attr("class", "c label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text(function(d){return ((langKey == "Japan") ? "時価総額" : "Market Capital") + dLabel;});
    var ylabel = svg.append("text")
        .attr("class", "yearLabel")
        .attr("text-anchor", "end")
        .attr("y", height - 24)
        .attr("x", width)
        .text(startYear);
    var senario = svg
                .append("g")
                .attr("class", "senario")
                //.attr("transform", "translate(" + (margin.left + 120) + "," + height + ")")
                .append("text")
                .attr("dy", "-0.5em");

    // A bisector since many companies' data is sparsely-defined.
    var bisect = d3.bisector(function(d) {
            return d[0];
        });

    var paths = svg.append("g").attr("class", "paths");
    for (i = 0; i < nCompanies; i++) {
        paths.append("path")
            .attr("d", line(getPath(startYear, i)))
            .attr("class", "path " + id(i));
    }
    var paths2 = timeline.append("g").attr("class", "paths2");
    for (i = 0; i < nCompanies; i++) {
        paths2.append("path")
            .attr("d", line2(getPath2(startYear, i)))
            .attr("class", "path2 " + id(i));
    }
    var areas2 = timeline.append("g").attr("class", "areas2");
    for (i = 0; i < nCompanies; i++) {
        areas2.append("path")
            .attr("d", area(getArea(startYear, i)))
            .attr("class", "area2 " + id(i))
            .attr("fill", "url(#gradient)");
    }
    var seeks = timeline.append("g").attr("class", "seeks")
        .selectAll("circle")
        .data(interpolateData(startYear))
        .enter().append("circle")
        .attr("class", function(d) { return "seek " + d.id; })
        .attr("r", 10)
        .call(positionSeeks);
    var seekLabels = timeline.append("g").attr("class", "seekLabels")
        .selectAll("text")
        .data(interpolateData(startYear))
        .enter().append("text")
        .attr("class", function(d) { return "seek-label " + d.id; })
        .call(positionSeekLabels);

    // bubble
    var dot = svg.append("g")
        .attr("class", "dots")
        .selectAll(".dot")
        .data(interpolateData(startYear))
        .enter()
        .append("circle")
        .attr("class", function(d) {
            return "dot " + d.id;
        })
        .attr("opacity", function(d) { return d.opacity;})
        .call(positionDots)
        .sort(order);

    // bubble label
    var dotLabels_bg = svg.append("g").attr("class", "dotLabels_bg")
        .selectAll("text")
        .data(interpolateData(startYear))
        .enter()
        .append("text")
        .attr("class", function(d){ return "dot-label_bg " + d.id; })
        .attr("text-anchor", "middle")
        .attr("opacity", function(d) { return d.opacity * 2;})
        .attr("display", "inline")
        .call(positionLabels)
        .text(function(d){ return companyName(d); });
    var dotLabels = svg.append("g").attr("class", "dotLabels")
        .selectAll("text")
        .data(interpolateData(startYear))
        .enter()
        .append("text")
        .attr("class", function(d){ return "dot-label " + d.id; })
        .attr("text-anchor", "middle")
        .attr("opacity", function(d) { return d.opacity * 2;})
        .attr("display", "inline")
        .call(positionLabels)
        .text(function(d){ return companyName(d); });
    var dotLabels2 = svg.append("g").attr("class", "dotLabels2")
        .selectAll("text")
        .data(interpolateData(startYear))
        .enter()
        .append("text")
        .attr("class", function(d){ return "dot-label2 " + d.id; })
        .attr("dy", "1.2em")
        .attr("text-anchor", "middle")
        .attr("opacity", function(d) { return d.opacity * 2;})
        .attr("display", "inline")
        .call(positionLabels);

    
    ////////////////////////
    // Animation controll //
    ////////////////////////    
    switch(playMode){
        case "senario":
            ANIMATION_TIME = 12*35*1000;
            startAnimation();
            senarioDemo([1400,height], [(margin.left + 120),height], [-1400, height]);      // Not Interactive mode
            break;
        case "default":
        default:
            startAnimation();   // Interactive mode
            break;
    }
    function startAnimation() {
        startTime = Date.now();
        if(playMode=="default"){
            svg.transition()
                .duration(ANIMATION_TIME)
                .ease("linear")
                .tween("year", tweenYear)
                .each("start", enableInteraction)
                .each("end", enableInteraction);
        }else{
            svg.transition()
                .duration(ANIMATION_TIME)
                .ease("linear")
                .tween("year", tweenYear)
                .each("end", enableInteraction);
        }
    }
    function stopAnimation() {
                svg.transition().duration(0);
                elapseTime = Date.now() - startTime;
                ANIMATION_TIME = ANIMATION_TIME - elapseTime;
                nowYear = nowYearG;            
    }
    
    ///////////////////////
    // Mouse event func. //
    ///////////////////////
    function enableInteraction() {
        svg.on("dblclick", function(d, i){
            filterReset();
            setDisplayAll();
        });

        dotLabels
            .on("mouseover", function(d, i) {
                stopAnimation();
                ylabel.classed("active", true);
                d3.select(".path." + d.id).classed("selected", true);
                d3.select(".path2." + d.id).classed("selected", true);
                d3.select(".seek." + d.id).classed("selected", true);
                d3.select(".seek-label." + d.id).classed("selected", true);
                d3.select(".dot." + d.id).classed("selected", true);
                d3.select(".dot-label." + d.id).classed("selected", true);
                d3.select(".dot-label2." + d.id).classed("selected", true);
                
                showPopover.call(this, d);
            })
            .on("mouseout", function(d) {
                startAnimation();

                ylabel.classed("active", false);
                d3.select(".path." + d.id).classed("selected", false);            
                d3.select(".path2." + d.id).classed("selected", false);
                d3.select(".seek." + d.id).classed("selected", false);
                d3.select(".seek-label." + d.id).classed("selected", false);
                d3.select(".dot." + d.id).classed("selected", false);
                d3.select(".dot-label." + d.id).classed("selected", false);
                d3.select(".dot-label2." + d.id).classed("selected", false);

                removePopovers();
            })            
            .on("click", function(d, i){
                stopAnimation();                    
                filterByCompany(d.id);
            });

        var drag = d3.behavior.drag()
            .origin(function(d) { return d; })
            .on("dragstart", dragstarted)
            .on("drag", dragged)
            .on("dragend", dragended);
        function dragstarted(d) {
            svg.transition().duration(0);
            d3.event.sourceEvent.stopPropagation();
            d3.select(this).classed("dragging", true);
        }
        function dragged(d) {
            d3.select(this).attr("x", d.x = d3.event.x);
            displayYear(tScale.invert(d3.mouse(this)[0]));
        }
        function dragended(d) {
          d3.select(this).classed("dragging", false);
        }
        seeks.call(drag);
    }

    
    ////////////////////////////
    // Bubble position Funcs. //
    ////////////////////////////    
    function positionDots(dot) {
        //表示位置
        dot
            .attr("cx", function(d) { return xScale(xValue(d)); })
            .attr("cy", function(d) { return yScale(yValue(d)); })
            .attr("r", function(d) { return radiusScale(radius(d));})
            .style("fill", function(d) { 
                if(flgHighLight){
                    if(companies_highlight[companyIndex(d.id)]){
                        return colorScale(color(d));
                        //強調表示モード　かつ　強調対象の時
                    }else{
                        return "#C7C7C7";
                    }
                }else{
                    return colorScale(color(d));
                    //強調表示モードでない（全表示）の時
                }
            });
    }
    function positionLabels(dotLabels) {
        dotLabels
            .attr("x", function(d) { return xScale(xValue(d)); })
            .attr("y", function(d) { return yScale(yValue(d)); });
    }
    function positionSeeks(seeks) {
        seeks
            .attr("cx", function(d) { return tScale(x2Value(d)); })
            .attr("cy", function(d) { return cScale(y2Value(d)); });
    }
    function positionSeekLabels(seekLabels) {
        seekLabels
            .attr("x", function(d) { return tScale(x2Value(d)); })
            .attr("y", function(d) { return cScale(y2Value(d)); });
    }
    function order(a, b) {
        return radius(b) - radius(a);
    }

    
    ///////////////////
    // Update Funcs. //
    ///////////////////    
    function tweenYear() {

        var nowYearF = d3.interpolateNumber(nowYear, endYear);
        return function(t) {
            displayYear(nowYearF(t));
        };
    }
    function displayYear(_yearF) {
        nowYearG = _yearF;

        dot.data(interpolateData(_yearF), key)
            .attr("opacity", function(d) { return d.opacity; })
            .call(positionDots)
            .sort(order);

        for (i = 0; i < nCompanies; i++) {
            paths.select(".path." + id(i))
                .attr("d", line(getPath(_yearF, i)));
            paths2.select(".path2." + id(i))
                .attr("d", line2(getPath2(_yearF, i)));
            areas2.select(".area2." + id(i))
                .attr("d", area(getArea(_yearF, i)));
        }
        dotLabels_bg
            .data(interpolateData(_yearF), key)
            .attr("opacity", function(d) {return d.opacity * 2;})
            .call(positionLabels)
            .sort(order);
        dotLabels
            .data(interpolateData(_yearF))
            .attr("opacity", function(d) {return d.opacity * 2;})
            .call(positionLabels)
            .sort(order);
        dotLabels2
            .data(interpolateData(_yearF), key)
            .attr("opacity", function(d) {return d.opacity * 2;})
            .call(positionLabels)
            .text(function(d){
                var symbol = d.capital_changeRate < 0 ? "▼" : "▲";
                var capLabel = formatT1(y2Value(d)); 
                return  symbol + capLabel + dLabel;
            })
            .style("fill", function(d){
                var _className = $(this).attr("class");
                if(_className.baseVal == ("dot-label2 " + d.id + " highlight")
                  || _className.baseVal == ("dot-label2 " + d.id + " selected")
                  || _className.baseVal == ("dot-label2 " + d.id + " highlight selected")
                  )
                    return colorScale(color(d));
                else
                    return "none";
            })
            .sort(order);
        seeks
            .data(interpolateData(_yearF), key)
            .attr("opacity", function(d) {return d.opacity;})
            .call(positionSeeks);
        seekLabels
            .data(interpolateData(_yearF), key)
            .attr("opacity", function(d) {return d.opacity;})
            .text(function(d){ 
                return companyName(d) + ":" + formatT2(y2Value(d)) + dLabel;
            })
            .call(positionSeekLabels);                

        //display Year
        ylabel.text(Math.floor(_yearF));
    }
    
    ////////////////////////
    // Interpolate Funcs. //
    ////////////////////////
    function interpolateData(_yearF) {
        return companyData.map(function(d) {
            return {
                id: d.id,
                name_us: d.name_us,
                name_jp: d.name_jp,
                market: d.market,
                symbol: d.symbol,
                category_us: d.category_us,
                category_jp: d.category_jp,
                memo: d.memo,
                country_us: d.country_us,
                country_jp: d.country_jp,
                employee: d.employee,
                revenue: interpolateValues(d.revenue, _yearF, "revenue"),
                profit: interpolateValues(d.profit, _yearF, "profit"),
                profitRate: interpolateValues(d.profitRate, _yearF, "profitRate"),
                assets: interpolateValues(d.assets, _yearF, "assets"),
                capital: interpolateValues(d.capital, _yearF, "capital"),
                capital_changeRate: interpolateValues(d.capital_changeRate, _yearF, "capital_changeRate"),
                opacity: interpolateValues(d.capital, _yearF, "opacity"),
                year: _yearF
            };
        });
    }
    function interpolateValues(values, _yearF, flg) {
        var i = bisect.left(values, _yearF, 0, values.length - 1);
        var nextYear = values[i][0];
        var nextValue = values[i][1];
        var lastYear  = (i==0) ? nextYear : values[i - 1][0];
        var lastValue = (i==0) ? 0 : values[i - 1][1];

        var weight = _yearF - lastYear;

        switch(flg){
            case "revenue":
            case "assets":
            case "profit":
                if(lastValue == 0 && nextValue != 0)
                    return nextValue;
                else if(lastValue != 0 && nextValue == 0){
                    return lastValue;
                }else{
                    return lastValue * (1 - weight) + nextValue * weight;
                }
                break;
            case "profitRate":
            case "capital_changeRate":
                if(lastValue == 0 && nextValue != 0)
                    return nextValue;
                else if(lastValue != 0 && nextValue == 0){
                    return lastValue;
                }else{
                    return lastValue * (1 - weight) + nextValue * weight;
                }
                break;
            case "capital":
                if (i!=0)
                    lastValue = values[i - 1][1];
                return lastValue * (1 - weight) + nextValue * weight;
                break;
            case "opacity":
                var Omax = 0.7, Omin = 0.0;
                if(nextValue != 0 && lastValue == 0)
                    return Omin * (1 - weight) + Omax * weight;
                else  if (nextValue == 0 && lastValue == 0)
                    return Omin;
                else
                    return Omax;
                break;
        }
    }
    // Get Sequence Data
    function getPath(_yearF, company_index) {
        var currData = [];
        var nextYear = Math.ceil(_yearF);
        var lastYear = Math.floor(_yearF);
        for ( j = 0; j < yearLength; j++){
            if ((startYear + j) < nextYear || lastYear == nextYear) {
                var _revenue = companyData[company_index].revenue[j][1],
                _profitRate = companyData[company_index].profitRate[j][1];                
                    if(_revenue > 0){
                    currData.push({
                        revenue: _revenue,
                        profitRate: _profitRate
                    });
                }
                if(startYear == nextYear) break;
            } else if ((startYear + j) == nextYear) {
                var nextRevenue = companyData[company_index].revenue[j][1] ,
                    lastRevenue = companyData[company_index].revenue[j-1][1],
                    nextProfitRate = companyData[company_index].profitRate[j][1], 
                    lastProfitRate = companyData[company_index].profitRate[j-1][1];
                var weight = _yearF - lastYear;
                if(lastRevenue > 0 || nextRevenue > 0)
                    currData.push({
                        revenue: lastRevenue * (1 - weight) + nextRevenue * weight,
                        profitRate: lastProfitRate * (1 - weight) + nextProfitRate * weight
                    });
                break;
            }
        }
        return currData;
    }
    function getPath2(_yearF, company_index) {
        var currData = [];
        var nextYear = Math.ceil(_yearF);
        var lastYear = Math.floor(_yearF);
        for ( j = 0; j < yearLength; j++) {
            if ((startYear + j) < nextYear || lastYear == nextYear) {
                var _year = companyData[company_index].capital[j][0],
                    _capital = companyData[company_index].capital[j][1];
                if(_capital > 0)
                    currData.push({
                        year: _year,
                        capital: _capital
                    });
                if(startYear == nextYear) break;
            } else if ((startYear + j) == nextYear) {
                var weight = _yearF - lastYear;
                var nextCap = companyData[company_index].capital[j][1];
                var lastCap = companyData[company_index].capital[j-1][1];
                if(lastCap > 0 || nextCap > 0)
                    currData.push({
                        year: _yearF,
                        capital: lastCap * (1 - weight) + nextCap * weight
                    });
                break;
            }
        }
        return currData;
    }
    function getArea(_yearF, company_index) {
        var currData = [];
        var nextYear = Math.ceil(_yearF);
        var lastYear = Math.floor(_yearF);
        for ( j = 0; j < yearLength; j++) {
            if ((startYear + j) < nextYear || lastYear == nextYear) {
                var _year = companyData[company_index].capital[j][0],
                    _capital = companyData[company_index].capital[j][1];
                if(_capital > 0)
                    currData.push({
                    year: _year,
                    capital: _capital
                });
                if(startYear == nextYear) break;
            } else if ((startYear + j) == nextYear) {
                var weight = _yearF - lastYear;
                var nextCap = companyData[company_index].capital[j][1];
                var lastCap = companyData[company_index].capital[j-1][1];
                if(lastCap > 0 || nextCap > 0)
                    currData.push({
                        year: _yearF,
                        capital: lastCap * (1 - weight) + nextCap * weight
                    });
                break;
            }
        }
        return currData;
    }
    

    /////////////////
    // Other Func. //
    /////////////////
    function maxCapitalById(_id) {
        var maxCap = 0;
        var currCap;
        for(var i=0;  i<yearLength; i++){
            currCap = companyData[companyIndex(_id)].capital[i][1];
            if(currCap > maxCap) maxCap = currCap;
        }
        return maxCap;
    }    


    //Reset
    filterReset();
};

//////////////////
// Filter Func. //
//////////////////
var filterKeyArea = [];
var filterKeyCompany = [];
var filterKeyCategory = [];
var companies_highlight = [];
var VS_NUM = 2;
var flgHighLight = false;

function initFilterKey(){
    filterKeyArea = [];
    filterKeyCompany = [];
    filterKeyCategory = [];
}
function initFlag(){
    for(var i=0; i<nCompanies; i++)
        companies_highlight[i] = false;
}
function filterReset(){
    initFlag();
    initFilterKey();
    flgHighLight = false;
}
function filterByCompanyCategory(keyCategory){
    flgHighLight = true;

    var flgAlready = false;
    for(var i=0; i<filterKeyCategory.length; i++)
        if(filterKeyCategory[i] == keyCategory)
            flgAlready = true;

    if(!flgAlready){
        if(filterKeyCategory.length == VS_NUM)
            filterKeyCategory.shift();
        filterKeyCategory.push(keyCategory);

        for(var i=0; i<nCompanies; i++){
            companies_highlight[i] = false;
            for(var j=0; j<filterKeyCategory.length; j++)
                if(companyData[i].category_us == filterKeyCategory[j])
                    companies_highlight[i] = true;                       
        }
    }

    d3.selectAll("a").classed("highlight", false);
    for(var i=0; i<filterKeyCategory.length; i++){
        //Replace space in id name by escape sequence
        var id_name = filterKeyCategory[i];
        id_name = id_name.replace(/ /g,'\\ ');
        d3.select("#filters_company_category")
            .select("a#" + id_name)
            .classed("highlight", true);
    }

    setHighLight();
    setUnHighLight();
}
function filterByCompany(keyCompany){
    flgHighLight = true;

    var flgAlready = false;
    for(var i=0; i<filterKeyCompany.length; i++)
        if(filterKeyCompany[i] == keyCompany)
            flgAlready = true;

    if(!flgAlready){
        if(filterKeyCompany.length == VS_NUM)
            filterKeyCompany.shift();
        filterKeyCompany.push(keyCompany);

        for(var i=0; i<nCompanies; i++){
            companies_highlight[i] = false;
            for(var j=0; j<filterKeyCompany.length; j++)
                if(companyData[i].id == filterKeyCompany[j])
                    companies_highlight[i] = true;
        }
    }

    d3.selectAll("a").classed("highlight", false);
    for(var i=0; i<filterKeyCompany.length; i++){
        d3.select("#filters_company")
            .select("a." + filterKeyCompany[i])
            .classed("highlight", true);
    }

    setHighLight();
    setUnHighLight();
}
function filterByArea(keyArea){
    flgHighLight = true;

    var flgAlready = false;
    for(var i=0; i<filterKeyArea.length; i++)
        if(filterKeyArea[i] == keyArea)
            flgAlready = true;

    if(!flgAlready){
        if(filterKeyArea.length == VS_NUM)
            filterKeyArea.shift();
        filterKeyArea.push(keyArea);

        for(var i=0; i<nCompanies; i++){
            companies_highlight[i] = false;
            for(var j=0; j<filterKeyArea.length; j++){
                var coutryList = getCompanyList(filterKeyArea[j]);
                for(var k=0; k<coutryList.length; k++)
                    if(companyData[i].country_us == coutryList[k])
                        companies_highlight[i] = true;
            }
        }
    }

    d3.selectAll("a").classed("highlight", false);
    for(var i=0; i<filterKeyArea.length; i++){
        d3.select("#filters_company")
            .select("a#" + filterKeyArea[i])
            .classed("highlight", true);
    }

    setHighLight();
    setUnHighLight();
}

function getCompanyList(keyArea){
    var arr;
    switch(keyArea){
        case "JAPAN":
            arr = ["Japan"];
            break;
        case "USA":
            arr = ["USA"];
            break;
        case "EU":
            arr = ["Germany", "Swedish", "Netherlands", "Finland", "Denmark", "French"];
            break;
        case "ASIA":
            arr = ["China", "Tiwan", "Korea"];
            break;
        default:
            arr = [];
            break;
    }
    return arr;
}

function setDisplayAll(){
    d3.selectAll(".dot").classed("un-highlight", false);
    d3.selectAll(".path").classed("un-highlight", false);
    d3.selectAll(".path2").classed("un-highlight", false);
    d3.selectAll(".area2").classed("un-highlight", false);
    d3.selectAll(".seek").classed("un-highlight", false);
    d3.selectAll(".seek-label").classed("un-highlight", false);
    d3.selectAll(".dot-label").classed("un-highlight", false);
    d3.selectAll(".dot-label_bg").classed("un-highlight", false);
    d3.selectAll(".dot-label2").classed("un-highlight", false);
    
    d3.selectAll(".dot").classed("highlight", false);
    d3.selectAll(".path").classed("highlight", false);
    d3.selectAll(".path2").classed("highlight", false);
    d3.selectAll(".area2").classed("highlight", false);
    d3.selectAll(".seek").classed("highlight", false);        
    d3.selectAll(".seek-label").classed("highlight", false);        
    d3.selectAll(".dot-label").classed("highlight", false);
    d3.selectAll(".dot-label2").classed("highlight", false);

    d3.selectAll("a").classed("selected", false);
    d3.selectAll("a").classed("highlight", false);
}

function setUnHighLight(){
    for(var i=0; i<nCompanies; i++){
        if(!companies_highlight[i]){
            var company_id = companyData[i].id;
            var dot_unselected = d3.selectAll(".dot." + company_id);
            var path_unselected = d3.selectAll(".path." + company_id);
            var path2_unselected = d3.selectAll(".path2." + company_id);
            var area2_unselected = d3.selectAll(".area2." + company_id);
            var seek_unselected = d3.selectAll(".seek." + company_id);
            var seekLabel_unselected = d3.selectAll(".seek-label." + company_id);
            var dotLabel_unselected = d3.selectAll(".dot-label." + company_id);
            var dotLabel_bg_unselected = d3.selectAll(".dot-label_bg." + company_id);
            var dotLabel2_unselected = d3.selectAll(".dot-label2." + company_id);
            var button_unselected = d3.select("#filters_company").selectAll("a." + company_id);

            dot_unselected.classed("highlight", false);
            path_unselected.classed("highlight", false);
            path2_unselected.classed("highlight", false);
            area2_unselected.classed("highlight", false);
            seek_unselected.classed("highlight", false);
            seekLabel_unselected.classed("highlight", false);
            dotLabel_unselected.classed("highlight", false);
            dotLabel2_unselected.classed("highlight", false);
            button_unselected.classed("selected", false);

            dot_unselected.classed("un-highlight", true);
            path_unselected.classed("un-highlight", true);
            path2_unselected.classed("un-highlight", true);
            area2_unselected.classed("un-highlight", true);
            seek_unselected.classed("un-highlight", true);
            seekLabel_unselected.classed("un-highlight", true);
            dotLabel_unselected.classed("un-highlight", true);
            dotLabel_bg_unselected.classed("un-highlight", true);
            dotLabel2_unselected.classed("un-highlight", true);
            //button_unselected.classed("un-highlight", true);
        }
    }
}

function setHighLight(){
    for(var i=0; i<nCompanies; i++){
        if(companies_highlight[i]){
            var company_id = companyData[i].id;
            var dot_selected = d3.selectAll(".dot." + company_id);
            var path_selected = d3.selectAll(".path." + company_id);
            var path2_selected = d3.selectAll(".path2." + company_id);
            var area2_selected = d3.selectAll(".area2." + company_id);
            var seek_selected = d3.selectAll(".seek." + company_id);
            var seekLabel_selected = d3.selectAll(".seek-label." + company_id);
            var dotLabel_selected = d3.selectAll(".dot-label." + company_id);
            var dotLabel_bg_selected = d3.selectAll(".dot-label_bg." + company_id);
            var dotLabel2_selected = d3.selectAll(".dot-label2." + company_id);
            var button_selected = d3.select("#filters_company").selectAll("a." + company_id);

            dot_selected.classed("un-highlight", false);
            path_selected.classed("un-highlight", false);
            path2_selected.classed("un-highlight", false);
            area2_selected.classed("un-highlight", false);
            seek_selected.classed("un-highlight", false);
            seekLabel_selected.classed("un-highlight", false);
            dotLabel_selected.classed("un-highlight", false);
            dotLabel_bg_selected.classed("un-highlight", false);
            dotLabel2_selected.classed("un-highlight", false);
            //button_selected.classed("un-highlight", false);

            dot_selected.classed("highlight", true);
            path_selected.classed("highlight", true);
            path2_selected.classed("highlight", true);
            area2_selected.classed("highlight", true);
            seek_selected.classed("highlight", true);
            seekLabel_selected.classed("highlight", true);
            dotLabel_selected.classed("highlight", true);
            dotLabel2_selected.classed("highlight", true);
            button_selected.classed("selected", true);
        }
    }
}


/////////////////
// Popup Func. //
/////////////////
function removePopovers () {
    $('.popover').each(function() {
        $(this).remove();
    }); 
}
function showPopover (d) {
    
    var name = (langKey=="Japan") ? d.name_jp : d.name_us;
    var market = d.market;
    var symbol = d.symbol;
    var category = (langKey=="Japan") ? d.category_jp : d.category_us;
    var country = (langKey=="Japan") ? d.country_jp : d.country_us;
    var employee = d.employee;
    var revenue = formatT1(d.revenue);
    var profit = formatT1(d.profit);
    var assets = formatT1(d.assets);
    var capital = formatT1(d.capital);
    
    var popParam = {
        placement: 'auto top',
        container: 'body',
        trigger: 'manual',
        //title: d.memo,
        html : true,
        content: function() {   
            return  (langKey=="Japan") ?
            "会社名: <val>" + name + "</val>" + 
            "<br/>株式市場: <val>" + market + "</val>" + 
            "<br/>銘柄コード: <val>" + symbol + "</val>" + 
            "<br/>タイプ: <val>" + category + "系</val>" + 
            "<br/>本社所在国: <val>" + country + "</val>" + 
            "<br/>従業員数: <val>" + employee + "</val>" + 
            "<br/>売上高[兆円]: <val>" + revenue + "</val>" + 
            "<br/>営業利益[兆円]: <val>" + profit + "</val>" + 
            "<br/>総資産[兆円]: <val>" + assets + "</val>" + 
            "<br/>時価総額[兆円]: <val>" + capital
            :
            "NAME: <val>" + name + "</val>" + 
            "<br/>MARKET: <val>" + market + "</val>" + 
            "<br/>SYMBOL: <val>" + symbol + "</val>" + 
            "<br/>TYPE: <val>" + category + "</val>" + 
            "<br/>HQ Country: <val>" + country + "</val>" + 
            "<br/>EMPLOYEE: <val>" + employee + "</val>" + 
            "<br/>REVENUE[B$]: <val>" + revenue + "</val>" + 
            "<br/>OPT. PROFIT[B$]: <val>" + profit + "</val>" + 
            "<br/>ASSETS[B$]: <val>" + assets + "</val>" + 
            "<br/>MARKET CAP.[B$]: <val>" + capital
            ; 
            }
        }    
    $(this).popover(popParam);   //set
    $(this).data('bs.popover').options.content = popParam.content;   //update
    $(this).popover('show');    //display
}
