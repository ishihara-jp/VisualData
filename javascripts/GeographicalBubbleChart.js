////////////////
//Global Var. //
////////////////

//var localPrefix = "http://localhost/";
var localPrefix = "";

var SRC_URL1 = localPrefix + "data/world-110m.json";
var SRC_URL2 = localPrefix + "data/world-110m-country-names.tsv";
var SRC_URL3 = localPrefix + "data/FinancialData.json";
var SRC_URL4 = localPrefix + "data/CompanyData.json";
var SRC_URL5 = localPrefix + "data/CurrencyRate.json";
var langKey;
var currency;

function setLangKey(_langKey){
    langKey = _langKey;        
}

//niconico flg
var SUKEx2 = true;

var mapWidth = 1200,
mapHeight = 500,
GlobeMode = true,
animation = false,
clipMode = false,
clusterMode = false,
popMode = false,
popParam,
speed = 1e-2,
lon360_now = 0,
lon_now = 0,
start360 = Date.now(),
start = Date.now(),
angle_offset = 0,
temp = angle_offset,
timeDelay = 0,
increAngle = 36,    //[deg.]
flgFirst = true,
timer_ret_val = false,
flgEnd = false;

var INIT_ROTATION_TIME = 500;
var EXPAND_MAP_TIME = 1000;

//format
var formatT0 = d3.format(".0f");
var formatT1 = d3.format(".1f");
var formatT2 = d3.format(".2f");

var projectionGlobe = d3.geo.orthographic()
.scale(500)
.center([-mapWidth/2, 0])
.translate([mapWidth-200, mapHeight])
.clipAngle(90);  // Trimming range [deg.]

/** SUKEx2 **/
if(SUKEx2) projectionGlobe.clipAngle(180);
/****/

var projectionMap = d3.geo.equirectangular()
.scale(200)
.center([-150, -50])
.translate([0, mapHeight]);

var projection = projectionGlobe;

d3.select("body")
    .attr("width", mapWidth).attr("height", mapHeight);

var canvas = d3.select("div#map").append("canvas")
.attr("overflow", "hidden")
.attr("width", mapWidth)
.attr("height", mapHeight);

var info_svg = d3.select("div#info").append("svg")
.attr("overflow", "hidden")
.attr("width", mapWidth)
.attr("height", mapHeight);

var context = canvas.node().getContext("2d");

var path = d3.geo.path()
.projection(projection)
.context(context);

var line = d3.svg.line()
.x(function(d) {return d[0];})
.y(function(d) {return d[1];});

//Loading data
queue()
.defer(d3.json, SRC_URL1)
.defer(d3.tsv, SRC_URL2)
.defer(d3.json, SRC_URL3)
.defer(d3.json, SRC_URL4)
.defer(d3.json, SRC_URL5)
.await(ready);


function ready(error, world, countryData, financialData, companyData, currencyData) {
    ///////////////////
    // Initial func. //
    ///////////////////
    
    var countryById = {};
    var land = topojson.feature(world, world.objects.land);
    var borders = topojson.mesh(world, world.objects.countries, function(a, b) {
        return a !== b;
    });
    var indicatices = d3.merge(
        d3.range(-180,181,30).map(function(lon) { 
        return d3.range(-60,61,30).map(function(lat) { 
            var r = 7.0;
            return d3.geo.circle().origin([ lon, lat ]).angle(r)();
        }); 
    })
    );
    
    var nCompanies = financialData.length;
    var nFY = financialData[0].assets.length;
    var startYear = financialData[0].assets[0][0];
    var endYear = financialData[0].assets[nFY-1][0];
    var currYear = startYear;
    var currYearF = startYear;
    var currIndex = 0;
    var currIndexF = 0.0;
    var padding = 20;
    var maxRadius = 80;
    
    //value limit
    var maxAssets = 0;
    for(var i=0; i<financialData.length; i++) {
        var max_tmp = 0, cRate = 1.0;
        for(var j=0; j<currencyData.length; j++) {
            cRate = (langKey=="Japan") ? currency_rate("USD/YEN", j) : 1.0;
            var temp = financialData[i].assets[j][1] / cRate;
            max_tmp = (temp > max_tmp)? temp : max_tmp;
        }
        maxAssets = (max_tmp > maxAssets) ? max_tmp : maxAssets; 
    }
    
    //Scalling
    var rScale = d3.scale.sqrt().domain([0, maxAssets]).range([0, 10]);
    var rScale2D = d3.scale.sqrt().domain([0, maxAssets]).range([0, 30]);
    var colorScale = d3.scale.linear()
                .domain([0,0.3])
                .interpolate(d3.interpolateRgb)
                .range(["#1cd2d2", "#E551FA"]);

    //Projection
    var globe2map = interpolatedProjection(projectionGlobe, projectionMap);
    var map2globe = interpolatedProjection(projectionMap, projectionGlobe);

    initBubble2DPos();
    

    //currency rate
    function currency_rate(_key, _yIndex){    
        for (var i = 0; i < currencyData.length; i++)
            if (currencyData[i].currency == _key)
                return currencyData[i].value[_yIndex].rate;
    }

    //change rate
    function change_rate(_id, _yIndex){
       for (var i=0; i< financialData.length; i++){
           if (financialData[i].id == _id){
               var currAssets = financialData[i].assets[_yIndex][1];
               var nextAssets = financialData[i].assets[(_yIndex < nFY - 1) ? _yIndex + 1 : _yIndex][1];

               if(currAssets == 0)
                   return 0.0;
               else
                   return (nextAssets - currAssets) / currAssets;
           }
        }
    }
    
    // Cluster center position
    var getCenters = function(key, size) {
        var centers, map;
        var sort_idx = 0;
        centers = _.uniq(_.pluck(companyData, key))
                .map(function(d) {
                    sort_idx++;
                    return {name: d, value: 1, sort_key: sort_idx};
                });
        
        //Reverse sort
        if(key=="area_jp" || key=="area_us")
            centers.sort(function(a,b){
            return d3.descending(a.sort_key, b.sort_key);
        });
        
        map = d3.layout.treemap().size(size).ratio(-1/1);
        map.nodes({children: centers});

        return centers;
    };
    
    var force = d3.layout.force();
    
    var popTarget,popSource;

    
    //////////////////////////
    // Element registration //
    //////////////////////////
    canvas.selectAll("path")
        .data(financialData)
      .enter().append("path")
        .attr("class", "tissot");
    var bubbles = info_svg.selectAll("circle")
        .data(financialData)
        .enter().append("circle")
        .attr("class", "bubbles");
    var graticule = d3.geo.graticule().step([10,10]);
    var glids = canvas.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);
    var cLines;
    addcLines();

    var cLabels = info_svg.selectAll("g")
        .data(financialData)
        .enter().append("g")
        .attr("class", "cLabels");
    cLabels.append("text")
        .attr("class", "companyLabel")
        .attr("dy", "-1em");
    cLabels.append("text")
        .attr("class", "assetLabel");
    var yLabel = info_svg.append("svg:text")
        .attr("class", "yearLabel")
        .attr("dy", "1em");
    var debug = info_svg.append("svg:text")
        .attr("class", "debugLabel")
        .attr("dy", "2em");
    
    
    ///////////////////////
    // Mouse event func. //
    ///////////////////////
    
    bubbles.on("mouseover", function(d) {
            if(clusterMode || GlobeMode === false){
                popMode = true;
                popTarget = this;
                popSource = d;

                showPopover.call(popTarget, d);
            }
        })
        .on("mouseout", function(d) {
            if(clusterMode || GlobeMode === false){
                removePopovers();
                popMode = false;
            }
        });
    
    $(".btn").click(function() {
        switch(this.id){
            case "3DMap":
                if(clusterMode){
                    addcLines();
                }
                clusterMode = false;
                removeLabelCluster();
                if(GlobeMode){
                    // nothing
                }else{
                    TransformProjection();  //2D -> 3D transform
                }
                break;
            case "2DMap":
                if(clusterMode){
                    addcLines();
                }
                clusterMode = false;
                removeLabelCluster();
                initBubble2DPos();
                if(GlobeMode){
                    TransformProjection();  //3D -> 2D transform
                }else{
                    // nothing
                }
                break;
            case "area_us":
            case "area_jp":
            case "category_us":
            case "category_jp": 
                removecLines();
                if(GlobeMode){
                    TransformProjection();  //3D -> 2D transform
                }else{
                    // nothing
                }
                clusterMode = true;
                initBubble2DPos();
                drawCluster(this.id);    // key = (HTML)id 
                break;
            default:
                break;
        }
    });
    
    
    ////////////////////////
    // Animation controll //
    //////////////////////// 
    d3.timer(function() {
        if(animation === false){
            lon_now = speed * (Date.now() - start - timeDelay);
            lon360_now = lon_now - (360 * Math.floor(lon_now / 360)); // Normalize 0-360
            
            if(flgEnd === false){
                //Float
                currYearF = startYear + lon_now / increAngle;
                currIndexF = lon_now / increAngle;

                //Integer
                currYear = Math.floor(currYearF);
                currIndex = Math.floor(currIndexF);
            }
            
            // Finish event
            if(currYear >= endYear){
                //timer_ret_val = true;   // stop
                flgEnd = true;
                currYearF = endYear;
                currIndex = nFY-1;
                currIndexF = currIndex;
                /*
                if(GlobeMode === true)
                    TransformProjection();  //3D -> 2D Transform
                */
            }

            // Rotation event
            if(GlobeMode === true)
                projection.rotate([lon360_now, 0]);

            // Display contents
            viewMapContents();
            viewInfoContents(lon360_now);
        }else{
            // Display contents
            viewInfoContents(lon360_now);               
        }
        return timer_ret_val;
    });

    //2D position initialization
    function initBubble2DPos(){
        for(var i=0; i<financialData.length; i++){
            financialData[i].radius = 0;
            financialData[i].x = projection(getPrintLocation(financialData[i].id))[0];
            financialData[i].y = projection(getPrintLocation(financialData[i].id))[1];
        }
    }
    

    //////////////////////////////
    // Transform controll func. //
    //////////////////////////////
    function TransformProjection() {
        animation = true;
        var transform_start_time = Date.now();

        // change projection method
        if (GlobeMode === true) {
            GlobeMode = false;
            
            //(1) Set angle to initial position
            var r = d3.interpolate(projection.rotate(), [0, 0]);
            d3.transition()
                .duration(INIT_ROTATION_TIME)
                .tween("rotate", function() {
                  return function(t) {
                    projection.rotate(r(t));
                    viewMapContents();
                    viewInfoContents(r(t)[0]);
                  }
                });

            //(2) Animation
            setTimeout(function() {
                projection = globe2map;
                path.projection(projection);
                clipMode = false;

                //(2-1) Display transforming
                d3.transition()
                .duration(EXPAND_MAP_TIME)
                .tween("projection", function() {
                  return function(_) {
                    projection.alpha(_);
                      viewMapContents();
                  };
                });

                //(2-2) Dispaly after transforming
                setTimeout(function(){
                    animation = false;
                    // set delay time while transform animation
                    timeDelay += Date.now() - transform_start_time;
                    viewInfoContents(0);
                }, EXPAND_MAP_TIME+100);

            }, INIT_ROTATION_TIME);

        } else {            
            projection = map2globe;
            path.projection(projection);
            clipMode = true;

            //(1) Display transforming
            d3.transition()
            .duration(EXPAND_MAP_TIME)
            .tween("projection", function() {
              return function(_) {
                projection.alpha(_);
                  viewMapContents();
              };
            });
            
            //(2) Set angle to initial position
            var r = d3.interpolate(projection.rotate(), [lon360_now, 0]);
            setTimeout(function(){
                d3.transition()
                    .duration(INIT_ROTATION_TIME)
                    .tween("rotate", function() {
                    return function(t) {
                        projection.rotate(r(t));
                        viewMapContents();
                        viewInfoContents(r(t)[0]);
                    }
                });
            }, EXPAND_MAP_TIME);
            
            //(3) Dispaly after transforming
            setTimeout(function(){
                animation = false;
                GlobeMode = true;
                // set delay time while transform animation
                timeDelay += Date.now() - transform_start_time;
            }, INIT_ROTATION_TIME+EXPAND_MAP_TIME+100);

        } 
    }

    ////////////////////////////
    // Display contents func. //
    ////////////////////////////

    // Map contents
    function viewMapContents(){

        context.save();

        context.clearRect(0, 0, mapWidth, mapHeight);
        
        if(GlobeMode){
        //Grid
        context.beginPath();
        context.strokeStyle = "#555";
        canvas.selectAll("path.graticule")
        .datum(graticule)
        .attr("d", path);
        context.stroke();
        context.restore();
        context.save();
        }
        
        //land
        context.beginPath();
        /** SUKEx2 **/
        if(SUKEx2){
            context.strokeStyle = "#555";
            path(land);
            context.stroke();
        }else{
            context.fillStyle = "#333";;
            path(land);
            context.fill();
        }
        /****/
        context.restore();
        context.save();
    }
    
    // Bubbles, Labels
    function viewInfoContents(_lon360_now){          
        //year label
        yLabel.text(currYear);    
        /*
        //debug
        debug.text("Angle[deg]: " + formatT2(_lon360_now) + 
                   "  Elapse time[ms]: " + (Date.now() - start360) + 
                   //"　　Start time: " + start360 +
                   "　　Deley time[ms]: " + timeDelay + 
                   "　　currIndex: " + currIndex + 
                   "　　currIndexF: " + formatT2(currIndexF) + 
                   "　　currYear: " + currYear + 
                   "　　currYearF: " + formatT2(currYearF));
        */
        
        //Bubbles
        if(GlobeMode){
            // 3D
            context.beginPath();
            context.fillStyle = "#1cd2d2";
            context.globalAlpha = 0.7;
            canvas.selectAll("path.tissot")
            .data(financialData)
            .attr("d", function(d){
                var location = getPrintLocation(d.id);
                var currAsset = getAssetF(d.id, currIndexF, currIndex);
                var r = rScale(currAsset);        
                return path(d3.geo.circle().origin(location).angle(r)());
            });        
            context.fill();
            context.restore();
            context.save();
        }else{
            // 2D   
            bubbles
                .attr("r", function(d) {
                    var currAsset = getAssetF(d.id, currIndexF, currIndex);
                    d.radius = rScale2D(currAsset);
                    return d.radius;
                })
            /*
                .style("fill", function(d) {
                    return colorScale(change_rate(d.id, currIndex));
                })
            */
                .classed("visible", function(d){ 
                        return isVisible(d.id, _lon360_now, currIndex); 
                });

            if(clusterMode==false){
                bubbles
                    .attr("cx", function(d){return projection(getPrintLocation(d.id))[0];})
                    .attr("cy", function(d){return projection(getPrintLocation(d.id))[1];});
            }
        }
        
        // Lines
        cLines
            .attr("d", function(d){
                var fromLocation = getLocation(d.id);
                var toLocation = getPrintLocation(d.id);
                var arry = [projection(fromLocation), projection(toLocation)];
                return line(arry);
            })
            .classed("visible", function(d){
                return isVisible(d.id, _lon360_now, currIndex); 
            });
        
        // Label group
        if(clusterMode==false){
            cLabels
                .attr("transform", function(d){
                    return "translate(" + projection(getPrintLocation(d.id)) + ")";
                });
        }
        cLabels
            .classed("visible", function(d){
                return isVisible(d.id, _lon360_now, currIndex);
            });

        // Company name label
        cLabels.selectAll(".companyLabel")
            /*
            .style("fill", function(d) {
                return colorScale(change_rate(d.id, currIndex));
            })
            */
            .text(function(d){
                return  (langKey=="Japan") ? 
                d.name_jp : d.id;
            });
        
        // Assets label
        cLabels.selectAll(".assetLabel")        
            /*
            .style("fill", function(d) {
                return colorScale(change_rate(d.id, currIndex));
            })
            */
            .text(function(d){
            var currAsset = getAssetF(d.id, currIndexF, currIndex);            
            if(currAsset > 0)
                return (langKey=="Japan") ?
                    formatT1(currAsset/1e6) + "兆円" : 
                    formatT1(currAsset/1e3) + "B$";
            else
                return "";  // nothing
            });
    }

    
    //////////////////////////////
    // Projection helper func.  //
    // (Interpolate projection) //
    //////////////////////////////
    function interpolatedProjection(a, b) {
        var projection = d3.geo.projection(raw).scale(1),
        center = projection.center,
        translate = projection.translate,
        clip = projection.clipAngle,
        w;

        function raw(angle1, angle2) {
            var pa = a([angle1 *= 180 / Math.PI, angle2 *= 180 / Math.PI]),
            pb = b([angle1, angle2]);
            return [(1 - w) * pa[0] + w * pb[0], (w - 1) * pa[1] - w * pb[1]];
        }

        projection.alpha = function(_) {
            if (!arguments.length) return w;
            w = +_;
            var ca = a.center(), cb = b.center(),
            ta = a.translate(), tb = b.translate();
            center([(1 - w) * ca[0] + w * cb[0], (1 - w) * ca[1] + w * cb[1]]);
            translate([(1 - w) * ta[0] + w * tb[0], (1 - w) * ta[1] + w * tb[1]]);
            if (clipMode === true) {clip(180 - w * 90);}
                return projection;
        };

        delete projection.scale;
        delete projection.translate;
        delete projection.center;
        return projection.alpha(0);
    }

    
    ////////////////////////////
    // Display controll func. //
    ////////////////////////////
    function isVisible(companyId, angle, _currIndex){
        var _lon = getPrintLocation(companyId)[0];
        var lon360;
        if(_lon < 0) lon360 = -_lon;        //West
        if(_lon > 0) lon360 = 360 - _lon;   //East

        // Display by angle
        var flg;
        if(angle > 360 - 90){
            var lon450 = (lon360 <= 90) ? lon360 + 360 : lon360;
            if(angle - 90 < lon450 && lon450 <= angle + 90)
                flg = true;
        }else if(angle > 90){
            if(angle - 90 < lon360 && lon360 <= angle + 90)
                flg = true;
        } else if(angle <= 90){
            var lon270 = (lon360 > 270) ? lon360 - 360 : lon360;
            if(angle - 90 < lon270 && lon270 < angle + 90)
                flg = true;
        }
        else
            flg = false;

        // Display by projection mode
        if(GlobeMode === false)
            flg = true;

        // Display by transforming animation
        if(animation === true)
            flg = false;

        /** SUKEx2 **/
        if(SUKEx2) flg = true;
        /****/

        // Display by data
        var _nextIndex = (_currIndex < nFY - 1) ? _currIndex + 1 : _currIndex;
        var _asset = getAssetF(companyId, _nextIndex, _nextIndex);
        if(_asset == 0)
            return false;
        else
            return flg;
    };

    /////////////////////////
    // Interpolation func. //
    /////////////////////////
    function getAssetF(companyId, _currIndexF, _currIndex){

        // Currency rate
        var lastRate, nextRate;    
        var _nextIndex = (_currIndex < nFY - 1) ? _currIndex + 1 : _currIndex;

        if(langKey == "Japan"){
            //YEN
            lastRate = currency_rate("USD/YEN", _currIndex);
            nextRate = currency_rate("USD/YEN", _nextIndex);
        }else{
            //USD
            lastRate = 1.0;
            nextRate = 1.0;                
        }
        //Get assets
        for(var i=0; i<financialData.length; i++){
            if(financialData[i].id == companyId){
                var lastAsset = financialData[i].assets[_currIndex][1] / lastRate;
                var nextAsset = financialData[i].assets[_nextIndex][1] / nextRate;
            }
        }
        var weight = _currIndexF - _currIndex;

        return nextAsset*weight + lastAsset*(1-weight);
    };

    
    //////////////////
    // Layout func. //
    //////////////////
    // line start position
     function getLocation(companyId){
         for(var i=0; i<companyData.length; i++){
            if(companyData[i].id == companyId){
                return [companyData[i].lon, companyData[i].lat];  //正式な緯度経度
            }
         }
     };
    // line end position
     function getPrintLocation(companyId){
         for(var i=0; i<companyData.length; i++){
            if(companyData[i].id == companyId){
                return [companyData[i].print_lon, companyData[i].print_lat];
            }
         }
     };

    // Display culuster mode
    function drawCluster(key) {
        var centers = getCenters(key, [mapWidth-100, mapHeight]);
        force.on("tick", tick(centers, key));
        labelCluster(centers);
        force.start();
    }

    // Force layout algorithm
    function tick (centers, key) {
        var foci = {};
        for (var i = 0; i < centers.length; i++) {
            foci[centers[i].name] = centers[i];
        }
        return function (e) {
            for (var i = 0; i < financialData.length; i++) {
                var o = companyData[i];
                var p = financialData[i];
                var f = foci[o[key]];
                    p.y += ((f.y + (f.dy / 2)) - p.y) * e.alpha;
                    p.x += ((f.x + (f.dx / 2)) - p.x) * e.alpha;
            }
            bubbles.each(collide(.11))
                .attr("r", function (d) {
                    return d.radius;
                })
                .attr("cx", function (d) { 
                    return d.x; 
                })
                .attr("cy", function (d) { 
                    return d.y; 
                });
            cLabels.each(collide(.11))
                .attr("transform", function(d){
                    return "translate(" + [d.x,d.y] + ")";
                });
        }
    }
    
    function collide(alpha) {
        var quadtree = d3.geom.quadtree(financialData);
        return function (d) {
            var r = d.radius + maxRadius + padding,
                nx1 = d.x - r,
                nx2 = d.x + r,
                ny1 = d.y - r,
                ny2 = d.y + r;
            quadtree.visit(function(quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== d)) {
                    var x = d.x - quad.point.x,
                        y = d.y - quad.point.y,
                        l = Math.sqrt(x * x + y * y),
                        r = d.radius + quad.point.radius + padding;
                    if (l < r) {
                      l = (l - r) / l * alpha;
                      d.x -= x *= l;
                      d.y -= y *= l;
                      quad.point.x += x;
                      quad.point.y += y;
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
        };
    }
    
    
    ////////////////
    // Line Func. //
    ////////////////
    function addcLines(){
        cLines = info_svg.selectAll("path")
            .data(financialData)
            .enter().append("path")
            .attr("class", "cLines");
    }

    function removecLines(){
        cLines.remove();
    }

    
    /////////////////////////
    // Cluster label Func. //
    /////////////////////////
    function labelCluster (centers) {
        info_svg.selectAll(".labelCluster").remove();

        info_svg.selectAll(".labelCluster")
            .data(centers).enter().append("text")
            .attr("class", "labelCluster")
            .attr("dy", "1em")
            .text(function (d) { return d.name })
            .attr("text-anchor", "middle")
            .style("font-size", function (d) {return (langKey == "Japan") ? "2em" : "1.5em";})
            .attr("transform", function (d) {
                return "translate(" + (d.x + (d.dx / 2)) + ", " + (d.y + 80) + ")";
            });
    }
    function removeLabelCluster(){
        info_svg.selectAll(".labelCluster").remove();
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
        // Currency rate and digit
        var cRate = (langKey=="Japan") ? currency_rate("USD/YEN", j) : 1.0;
        var cDigit = (langKey=="Japan") ? 1e6 : 1e3;

        // Get current data
        var name = (langKey=="Japan") ? d.name_jp : d.name_us;
        var market = d.market;
        var symbol = d.symbol;
        var category = (langKey=="Japan") ? d.category_jp : d.category_us;
        var country = (langKey=="Japan") ? d.country_jp : d.country_us;
        var employee = d.employee;
        var revenue = formatT1(d.revenue[currIndex][1] / cRate / cDigit);
        var profit = formatT1(d.profit[currIndex][1] / cRate / cDigit);
        var assets = formatT1(d.assets[currIndex][1] / cRate / cDigit);
        var capital = formatT1(d.capital[currIndex][1] / cRate / cDigit);

        popParam = {
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
            "<br/>MARKET CAP.[M$]: <val>" + capital
            ; 
            }
        }

        $(popTarget).popover(popParam);   //set
        $(popTarget).data('bs.popover').options.content = popParam.content;   //update
        $(popTarget).popover('show');    //display
    }
};

