//グローバル変数
var DATA_SRC1 = "data/CurrencyRate.json";
var DATA_SRC2 = "data/FinancialData.json";
var companyData;
var currencyData;
var langKey;
var playMode = "default";    //再生モード
var ANIMATION_TIME = 60*1000; //アニメーション時間 (仕上がり：12*35*1000、キャプチャ時：24*35*1000)
var nCompanies;
var startTime;
var elapseTime;
var dLabel;

//書式
var formatT0 = d3.format(".0f");
var formatT1 = d3.format(".1f");
var formatT2 = d3.format(".2f");
            
//言語設定
function setLangKey(_langKey){
    //"Japan" or "English";
    langKey = _langKey;        
}

//再生モード設定
function setPlayMode(_modeKey){
    playMode = _modeKey;
}

//Loading data
queue()
.defer(d3.json, DATA_SRC1)
.defer(d3.json, DATA_SRC2)
.await(ready);


function ready(error, data1, data2) {

    //グローバル化
    currencyData = data1;
    companyData = data2;

    //other : currecny rate
    function currency_rate(key, yIndex){    
        for (var i = 0; i < currencyData.length; i++)
            if (currencyData[i].currency == key)
                return currencyData[i].value[yIndex].rate;
    }
    
    //パラメータ
    var filterKey = "ALL";
    var visFlg = false;
    
    //値域
    nCompanies = companyData.length;
    var yearLength = companyData[0].revenue.length;
    var startYear = companyData[0].revenue[0][0];
    var nowYear = startYear;
    var nowYearG;
    var endYear = companyData[0].revenue[yearLength - 1][0];

    //[兆円] or [Billion USD]へ変換
    for(var i=0; i<nCompanies; i++){
        for(var j=0; j<yearLength; j++){
            //データ取得
            var _revenue = companyData[i].revenue[j][1];  //[Million USD]
            var _capital = companyData[i].capital[j][1];  //[Million USD]
            var _assets  = companyData[i].assets[j][1];   //[Million USD]
            //通貨・桁数
            var cRate, cDigit;
            switch(langKey){
                case "Japan":
                    //YEN
                    cRate = currency_rate("USD/YEN", j);
                    cDigit = 1e6;
                    dLabel = "[兆円]";
                    break;
                default:
                    //USD
                    cRate = 1.0;
                    cDigit = 1e3;
                    dLabel = "[Billion USD]";
                    break;
            }
            //変換＆書き換え
            companyData[i].revenue[j][1] = (_revenue / cRate) / cDigit;
            companyData[i].capital[j][1] = (_capital / cRate) / cDigit;
            companyData[i].assets[j][1]  = (_assets / cRate) / cDigit;
        }
    }

    //最大・最小値
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
    // Data - Visualize relation func.
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
    //y2 axis : market cap. [兆円 or Billion USD]
    function y2Value(d) {
        return d.capital;
    }
    //for label : total assets [兆円 or Billion USD]
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
        return (langKey == "Japan") ? d.name_jp : d.name_us;
    }
    //other : yIndex
    function yearIndex(_year) {
        return (_year > endYear) ? endYear - startYear : _year - startYear;   
    }
    

    
    // 表示領域の設定
    var margin = {
            top: 50,
            right: 200,
            bottom: 50,
            left: 50
        },
        width = 1400 - margin.right - margin.left,
        height = 576 - margin.top;
        t_height = 300 - margin.bottom; //タイムラインの高さ

    // スケーリング
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

    // 軌跡
    var line = d3.svg.line()
        .x(function(d) { return xScale(xValue(d)); })
        .y(function(d) { return yScale(yValue(d)); });
    // 時系列チャート
    var line2 = d3.svg.line()
        .x(function(d) { return tScale(x2Value(d));})
        .y(function(d) { return cScale(y2Value(d));});
    var area = d3.svg.area()
        .x(function(d) { return tScale(x2Value(d));})
        .y0(function(d) { return cScale(0);})
        .y1(function(d) { return cScale(y2Value(d));});
    
    // X,Y軸
    var xAxis = d3.svg.axis()
            .orient("bottom")
            .scale(xScale)
            .ticks(12, d3.format(",d"))
            .innerTickSize(-height) // 目盛線の長さ（内側）
            .outerTickSize(0) // 目盛線の長さ（外側）
            .tickPadding(10); // 目盛線とテキストの間の長さ
    var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .innerTickSize(-width) // 目盛線の長さ（内側）
            .outerTickSize(0) // 目盛線の長さ（外側）
            .tickPadding(10); // 目盛線とテキストの間の長さ
    var tAxis = d3.svg.axis()
            .orient("bottom")
            .scale(tScale)
            //.tickValues([1981, 1985, 1990, 1995, 2000, 2005, 2010, 2015])
            .tickFormat(d3.format("04d"))
            .innerTickSize(-t_height)  // 目盛線の長さ（内側）
            .outerTickSize(0) // 目盛線の長さ（外側）
            .tickPadding(5);  // 目盛線とテキストの間の長さ
    var cAxis = d3.svg.axis()
            .scale(cScale)
            .orient("left")
            .innerTickSize(-width)  // 目盛線の長さ（内側）
            .outerTickSize(0) // 目盛線の長さ（外側）
            .tickPadding(10); // 目盛線とテキストの間の長さ
    
    // チャート用SVGコンテナ作成
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    // タイムライン用SVGコンテナ作成
    var timeline = d3.select("#TimeLine").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", t_height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    // X軸の追加
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
    // Y軸の追加
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    // X軸(濃い色用)の追加
    svg.append("line")
        .attr("class", "axisLine")
        .attr("y1", height)
        .attr("y2", height)
        .attr("x1", 0)
        .attr("x2", width);
    // Y軸(濃い色用)の追加
    svg.append("line")
        .attr("class", "axisLine")
        .attr("y1", 0)
        .attr("y2", height)
        .attr("x1", 0)
        .attr("x2", 0);
    // 補助線（０％）の追加
    svg.append("line")
        .attr("y1",yScale(0))
        .attr("y2",yScale(0))
        .attr("x1",0)
        .attr("x2",width)
        .style("stroke","gray")
        .append("title").text("Zero line");

    // 凡例の追加
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

    // 時系列チャートY軸の追加
    timeline.append("g")
        .attr("class", "c axis")
        .call(cAxis);
    // 時系列チャートX軸(濃い色用)の追加
    timeline.append("line")
        .attr("class", "axisLine")
        .attr("y1", t_height)
        .attr("y2", t_height)
        .attr("x1", 0)
        .attr("x2", width);
    // 時系列チャートY軸(濃い色用)の追加
    timeline.append("line")
        .attr("class", "axisLine")
        .attr("y1", 0)
        .attr("y2", t_height)
        .attr("x1", 0)
        .attr("x2", 0);
    // 時系列チャートX軸の追加
    timeline.append("g")
        .attr("class", "t axis")
        .attr("transform", "translate(0," + t_height + ")")
        .call(tAxis);
    // 時系列チャートX軸ラベルの追加
    timeline.append("text")
        .attr("class", "t label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", t_height - 10)
        .text("年");

    //　グラデーション
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
    
    
    // X軸ラベルの追加
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text(function(d){return ((langKey == "Japan") ? "売上高" : "Revenue") + dLabel;});
    // Y軸ラベルの追加
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text(function(d){return ((langKey == "Japan") ? "営業利益率" : "Profit Rate") + "[%]";});
    // 時系列チャートラベルの追加
    timeline.append("text")
        .attr("class", "c label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text(function(d){return ((langKey == "Japan") ? "時価総額" : "Market Capital") + dLabel;});
    // 年ラベルの追加
    var ylabel = svg.append("text")
        .attr("class", "year label")
        .attr("text-anchor", "end")
        .attr("y", height - 24)
        .attr("x", width)
        .text(startYear);

 
    // シナリオストーリー用ラベル
    var senario = svg/*d3.select("#senario")*/
                .append("g")
                .attr("class", "senario")
                .attr("transform", "translate(" + (margin.left + 120) + "," + height + ")")
                .append("text")
                .attr("dy", "-0.5em");

    // A bisector since many companies' data is sparsely-defined.
    var bisect = d3.bisector(function(d) {
            return d[0];
        });

    // 軌跡の追加
    var paths = svg.append("g").attr("class", "paths");
    for (i = 0; i < nCompanies; i++) {
        paths.append("path")
            .attr("d", line(getPath(startYear, i)))
            .attr("class", "path " + id(i));
    }

    // 時系列チャートの追加
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

    // シークボタンの追加
    var seeks = timeline.append("g").attr("class", "seeks")
        .selectAll("circle")
        .data(interpolateData(startYear))
        .enter().append("circle")
        .attr("class", function(d) { return "seek " + d.id; })
        .attr("r", 10)
        .call(positionSeeks);
    // シークラベルの追加
    var seekLabels = timeline.append("g").attr("class", "seekLabels")
        .selectAll("text")
        .data(interpolateData(startYear))
        .enter().append("text")
        .attr("class", function(d) { return "seek-label " + d.id; })
        .call(positionSeekLabels);

    // プロット円の追加と色設定
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

    // プロットラベルの追加
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


    // 年代推移によるトランジション開始
    switch(playMode){
        case "senario":
            ANIMATION_TIME = 12*35*1000;
            //シナリオモード
            senarioDemo();
            break;
        case "default":
        default:
            //インタラクティブモード
            startAnimation();
            break;
    }    

    //　アニメーション開始
    function startAnimation() {
        startTime = Date.now(); //開始時間
        svg.transition()
            .duration(ANIMATION_TIME)           //アニメーション時間
            .ease("linear")                     //トランジション方式
            .tween("year", tweenYear)           //アニメーションイベント
            .each("end", enableInteraction);    //アイメーション後イベント
        if(playMode=="default")
            svg.each("start", enableInteraction);   //アニメーション中イベント

    }

    //　アニメーション一時停止
    function stopAnimation() {
                //現在のトランジションを一旦停止
                svg.transition().duration(0);
                //経過時間
                elapseTime = Date.now() - startTime;
                // 残りアニメーション時間を更新
                ANIMATION_TIME = ANIMATION_TIME - elapseTime;
                // 開始年を直前までの更新
                nowYear = nowYearG;            
    }


    // マウスイベント制御
    function enableInteraction() {
        //キャンバス
        svg.on("dblclick", function(d, i){
            //フィルタリセット
            filterReset();
            setDisplayAll();
        });


        //円ラベル
        dotLabels
            .on("mouseover", function(d, i) {
                //アニメーション一時停止
                stopAnimation();

                //年ラベル強調
                ylabel.classed("active", true);
                //軌跡&ラベルの強調
                d3.select(".path." + d.id).classed("selected", true);
                d3.select(".path2." + d.id).classed("selected", true);
                d3.select(".seek." + d.id).classed("selected", true);
                d3.select(".seek-label." + d.id).classed("selected", true);
                d3.select(".dot." + d.id).classed("selected", true);
                d3.select(".dot-label." + d.id).classed("selected", true);
                d3.select(".dot-label2." + d.id).classed("selected", true);
            })
            .on("mouseout", function(d) {

                //アニメーション再開
                startAnimation();

               //年ラベル非強調
                ylabel.classed("active", false);
                //軌跡&ラベルの非強調
                d3.select(".path." + d.id).classed("selected", false);            
                d3.select(".path2." + d.id).classed("selected", false);
                d3.select(".seek." + d.id).classed("selected", false);
                d3.select(".seek-label." + d.id).classed("selected", false);
                d3.select(".dot." + d.id).classed("selected", false);
                d3.select(".dot-label." + d.id).classed("selected", false);
                d3.select(".dot-label2." + d.id).classed("selected", false);
            })            
            .on("click", function(d, i){
                //アニメーション一時停止
                stopAnimation();                    
                //フィルタ強調表示
                filterByCompany(d.id);
            });


        //ドラッグ制御
        var drag = d3.behavior.drag()
            .origin(function(d) { return d; })
            .on("dragstart", dragstarted)
            .on("drag", dragged)
            .on("dragend", dragended);
        //ドラッグ開始
        function dragstarted(d) {
            svg.transition().duration(0);
            d3.event.sourceEvent.stopPropagation();
            d3.select(this).classed("dragging", true);
        }
        //ドラッグ中
        function dragged(d) {
            //オブジェクト移動
            d3.select(this).attr("x", d.x = d3.event.x);
            //平行移動分だけ年を変化
            displayYear(tScale.invert(d3.mouse(this)[0]));
        }
        //ドラッグ終了
        function dragended(d) {
          d3.select(this).classed("dragging", false);
        }
        //シークボタン
        seeks.call(drag);

    }


    // プロット位置と半径の取得と表示制御
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
    // ラベル位置の取得と表示制御
    function positionLabels(dotLabels) {
        //表示位置
        dotLabels
            .attr("x", function(d) { return xScale(xValue(d)); })
            .attr("y", function(d) { return yScale(yValue(d)); });
    }
    // シーク位置の取得と表示制御
    function positionSeeks(seeks) {
        //表示位置
        seeks
            .attr("cx", function(d) { return tScale(x2Value(d)); })
            .attr("cy", function(d) { return cScale(y2Value(d)); });
    }
    // シークラベル位置の取得と表示制御
    function positionSeekLabels(seekLabels) {
        //表示位置
        seekLabels
            .attr("x", function(d) { return tScale(x2Value(d)); })
            .attr("y", function(d) { return cScale(y2Value(d)); });
    }
    // 重なり順.
    function order(a, b) {
        return radius(b) - radius(a);
    }

    // リアルタイム更新部分
    // 最初のアニメーションが終了後に、補間されたデータ、ドット、ラベルを再描画
    function tweenYear() {

        var nowYearF = d3.interpolateNumber(nowYear, endYear);
        return function(t) {
            displayYear(nowYearF(t));
        };
    }
    //表示の更新
    function displayYear(_yearF) {
        //グローバル変数に現在の年（少数）を登録
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
            .data(interpolateData(_yearF), key)
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

        //年ラベル
        ylabel.text(Math.floor(_yearF));  //小数点切り捨て 

    }
    // 与えられた年代に該当する各データ要素を返す
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
                profitRate: interpolateValues(d.profitRate, _yearF, "profitRate"),
                assets: interpolateValues(d.assets, _yearF, "assets"),
                capital: interpolateValues(d.capital, _yearF, "capital"),
                capital_changeRate: interpolateValues(d.capital_changeRate, _yearF, "capital_changeRate"),
                opacity: interpolateValues(d.capital, _yearF, "opacity"),
                year: _yearF
            };
        });
    }


    // 各年代データを線形に補間（連続値となるように）
    // flgCurrency：trueなら 通貨レート変換を有効化
    function interpolateValues(values, _yearF, flg) {
        //補間したい基準値
        var i = bisect.left(values, _yearF, 0, values.length - 1);
        var nextYear = values[i][0];
        var nextValue = values[i][1];
        var lastYear  = (i==0) ? nextYear : values[i - 1][0];
        var lastValue = (i==0) ? 0 : values[i - 1][1];

        //補間計算
        var weight = _yearF - lastYear;   //比率

        switch(flg){
            case "revenue":
            case "assets":
                if(lastValue == 0 && nextValue != 0)
                    //初めてデータが現れる時は補間せず初期値で
                    return nextValue;
                else if(lastValue != 0 && nextValue == 0){
                    //最後にデータが現れるときは補間せず最終値で    
                    return lastValue;
                }else{
                    //線形補間
                    return lastValue * (1 - weight) + nextValue * weight;
                }
                break;

            case "profitRate":
            case "capital_changeRate":
                if(lastValue == 0 && nextValue != 0)
                    //初めてデータが現れる時は補間せず初期値で
                    return nextValue;
                else if(lastValue != 0 && nextValue == 0){
                    //最後にデータが現れるときは補間せず最終値で    
                    return lastValue;
                }else{
                    //線形補間
                    return lastValue * (1 - weight) + nextValue * weight;
                }
                break;

            case "capital":
                if (i!=0)
                    //lastValue = 0; //前回：非表示→今回：表示の時
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
        var nextYear = Math.ceil(_yearF); //少数点切り上げ
        var lastYear = Math.floor(_yearF); //小数点切り捨て
        for ( j = 0; j < yearLength; j++){
            if ((startYear + j) < nextYear || lastYear == nextYear) {
                //既に通り過ぎた年度 or 年度ピッタリのとき
                var _revenue = companyData[company_index].revenue[j][1],
                _profitRate = companyData[company_index].profitRate[j][1];                
                    if(_revenue > 0){    //データがある時
                    currData.push({
                        revenue: _revenue,
                        profitRate: _profitRate
                    });
                }
                if(startYear == nextYear) break; //開始時
            } else if ((startYear + j) == nextYear) {
                //現在表示中の年度（途中なので線形補間）
                var nextRevenue = companyData[company_index].revenue[j][1] ,
                    lastRevenue = companyData[company_index].revenue[j-1][1],
                    nextProfitRate = companyData[company_index].profitRate[j][1], 
                    lastProfitRate = companyData[company_index].profitRate[j-1][1];
                var weight = _yearF - lastYear;
                if(lastRevenue > 0 || nextRevenue > 0)  //データがある時
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
        var nextYear = Math.ceil(_yearF); //少数点切り上げ
        var lastYear = Math.floor(_yearF); //小数点切り捨て
        for ( j = 0; j < yearLength; j++) {
            if ((startYear + j) < nextYear || lastYear == nextYear) {
                //既に通り過ぎた年度 or 年度ピッタリのとき
                var _year = companyData[company_index].capital[j][0],
                    _capital = companyData[company_index].capital[j][1];

                if(_capital > 0)    //データがある時
                    currData.push({
                        year: _year,
                        capital: _capital
                    });
                if(startYear == nextYear) break; //開始時
            } else if ((startYear + j) == nextYear) {
                //現在表示中の年度（途中なので線形補間）
                var weight = _yearF - lastYear;
                var nextCap = companyData[company_index].capital[j][1];
                var lastCap = companyData[company_index].capital[j-1][1];

                if(lastCap > 0 || nextCap > 0) //データがある時
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
        var nextYear = Math.ceil(_yearF); //少数点切り上げ
        var lastYear = Math.floor(_yearF); //小数点切り捨て
        for ( j = 0; j < yearLength; j++) {
            if ((startYear + j) < nextYear || lastYear == nextYear) {
                //既に通り過ぎた年度 or 年度ピッタリのとき
                var _year = companyData[company_index].capital[j][0],
                    _capital = companyData[company_index].capital[j][1];

                if(_capital > 0)    //データがある時
                    currData.push({
                    year: _year,
                    capital: _capital
                });
                if(startYear == nextYear) break; //開始時
            } else if ((startYear + j) == nextYear) {
                //現在表示中の年度（途中なので線形補間）
                var weight = _yearF - lastYear;
                var nextCap = companyData[company_index].capital[j][1];
                var lastCap = companyData[company_index].capital[j-1][1];

                if(lastCap > 0 || nextCap > 0)  //データがある時
                    currData.push({
                        year: _yearF,
                        capital: lastCap * (1 - weight) + nextCap * weight
                    });
                break;
            }
        }
        return currData;
    }
    //各企業の最大時価総額
    function maxCapitalById(_id) {
        var maxCap = 0;
        var currCap;
        for(var i=0;  i<yearLength; i++){
            currCap = companyData[companyIndex(_id)].capital[i][1];
            if(currCap > maxCap) maxCap = currCap;
        }
        return maxCap;
    }    

    //シナリオモード
    function senarioDemo(){

        var SecPerYear = ANIMATION_TIME/35 + 350*2;
        var HighlightTime = SecPerYear * 0.3;

        startAnimation();

        //1982
        setTimeout(function(){
            filterByCompany("NEC");
            senario.text("NEC：PC-9800シリーズ発売");

            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);

        },SecPerYear);

        //1983
        setTimeout(function(){
            filterByCompany("CASIO");
            senario.text("カシオ：腕時計「G-SHOCK」発売");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*2);

        //1984
        setTimeout(function(){
            filterByCompany("KYOCERA");
            senario.text("京セラ：第二電電（DDI）設立。後にKDD、IDOと合併し、KDDIとなる");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*3);

        //1985
        setTimeout(function(){
            filterByCompany("TOSHIBA");
            filterByCompany("INTEL");
            senario.text("東芝：世界初1メガDRAM開発。メモリ開発分野で世界トップへ　／　インテル：DRAM事業撤退。CPUの開発・生産に経営資源を集中");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime*1.5);
        },SecPerYear*4);

        //1986
        setTimeout(function(){
            filterByCompany("FUJIFILM");
            senario.text("富士フィルム：レンズ付きフィルム「写ルンです」発売");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*5);

        //1987
        setTimeout(function(){
            filterByCompany("NEC");
            senario.text("NEC：家庭用ゲーム機「PCエンジン」発売");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*6);

        //1988
        setTimeout(function(){
            filterByCompany("PANASONIC");
            senario.text("パナソニック：家電を「National」ブランドから「Panasonic」ブランドへ移行");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*7);

        //1989
        setTimeout(function(){
            filterByCompany("SONY");
            senario.text("ソニー：コロンビア・ピクチャーズ・エンタテイメントを買収し映画事業に参入");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*8);

        //1990
        setTimeout(function(){
            filterByCompany("PIONEER");
            senario.text("パイオニア：世界初のGPSカーナビゲーション発売");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*9);

        //1991
        setTimeout(function(){
            filterByCompany("IBM");
            senario.text("IBM：メインフレームの業績悪化により49億ドルの損失発表。当時、米国史上最悪値を記録");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*10);

        //1992
        setTimeout(function(){
            senario.text("日本ではバブル景気崩壊");
        },SecPerYear*11);

        //1993
        setTimeout(function(){
            filterByCompany("INTEL");
            senario.text("インテル：x86向け第5世代CPU「Pentium」を発売");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*12);

        //1994
        setTimeout(function(){
            filterByCompany("SONY");
            senario.text("ソニー：家庭用ゲーム機「PlayStation」発売");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*13);

        //1995
        setTimeout(function(){
            filterByCompany("MICROSOFT");
            senario.text("マイクロソフト：Windows 95 発売");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*14);

        //1996
        setTimeout(function(){
            filterByCompany("ERICSSON");
            senario.text("エリクソン：ソニーと合弁でソニー・エリクソン設立。携帯事業へ進出");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*15);

        //1997
        setTimeout(function(){
            filterByCompany("APPLE");
            senario.text("アップル：スティーブ・ジョブズ復帰。iMac発表やロゴデザイン一新など新生Appleを印象付ける");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*16);

        //1998
        setTimeout(function(){
            filterByCompany("NOKIA");
            senario.text("ノキア：エリクソン等と共同でシンビアン社設立。同社OSは日本のフューチャーフォンに多く採用。13年間にわたり携帯シェア世界トップに君臨");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime*1.5);
        },SecPerYear*17);

        //1999
        setTimeout(function(){
            filterByCompany("MICROSOFT");
            senario.text("マイクロソフト：1999年12月30日 時価総額が史上最高額を塗り替える");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*18);

        //2000
        setTimeout(function(){
            filterByCompany("CISCO");
            senario.text("シスコ：時価総額5,000億US$に達し、マイクロソフトを抜き世界一");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*19);

        //2001
        setTimeout(function(){
            senario.text("ITバブル崩壊。その後、「選択と集中」の名のもと、電機業界の再編が加速してゆく");
        },SecPerYear*20);

        //2002
        setTimeout(function(){
            filterByCompany("HP");
            senario.text("HP：コンピュータ大手コンパックを買収");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*21);

        //2003
        setTimeout(function(){
            filterByCompany("HITACHI");
            senario.text("日立：IBM HDD部門を買収。三菱電機と半導体合弁ルネサステクノロジ設立");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*22);

        //2004
        setTimeout(function(){
            filterByCompany("LENOVO");
            senario.text("レノボ：IBM PC部門を買収");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*23);

        //2005
        setTimeout(function(){
            filterByCompany("SIEMENS");
            senario.text("シーメンス：携帯部門を台湾BenQへ売却");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*24);

        //2006
        setTimeout(function(){
            filterByCompany("TOSHIBA");
            senario.text("東芝：米ウェスティングハウス買収。原子力発電世界三大メーカーの一角へ");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*25);

        //2007
        setTimeout(function(){
            filterByCompany("APPLE");
            senario.text("アップル：iPhone 発表");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*26);

        //2008
        setTimeout(function(){
            senario.text("リーマンショックによる世界金融危機。スマホ時代の幕開けとともに、多くの国内メーカーの携帯事業が失速");
        },SecPerYear*27);

        //2009
        setTimeout(function(){
            filterReset();
            setDisplayAll();

            filterByCompany("SANYO");
            senario.text("三洋電機：パナソニックによる完全子会社化が決定");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*28);

        //2010
        setTimeout(function(){
            filterByCompany("ORACLE");
            senario.text("オラクル：Javaやワークステーションで知られる米IT大手サン・マイクロシステムズ買収");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*29);

        //2011
        setTimeout(function(){
            filterByCompany("FUJITSU");
            senario.text("富士通：理研と共同でスーパーコンピュータ「京」を開発。世界一を奪還");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*30);

        //2012
        setTimeout(function(){
            filterByCompany("APPLE");
            filterByCompany("SAMSUNG");
            senario.text("アップルは時価総額世界1位に。サムスンとアップルの特許訴訟は泥仕合の様相へ");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime*1.5);
        },SecPerYear*31);

        //2013
        setTimeout(function(){
            filterByCompany("DELL");
            senario.text("デル：上場廃止。非公開株化");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*32);

        //2014
        setTimeout(function(){
            filterByCompany("LENOVO");
            filterByCompany("NOKIA");
            senario.text("ノキア：携帯部門をマイクロソフトへ売却　／　レノボ：Googleから携帯部門モトローラ・モビリティを買収");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime*1.5);
        },SecPerYear*33);

        //2015
        setTimeout(function(){
            filterByCompany("TOSHIBA");
            senario.text("東芝：不適切会計問題発覚");
            setTimeout(function(){
                senario.text("");
                filterReset();
                setDisplayAll();
            }, HighlightTime);
        },SecPerYear*34);

    }

    //可視化制御フィルタの初期化
    filterReset();

};

//////////////////////////////////////////////////
// 補助関数群
//////////////////////////////////////////////////
var filterKeyArea = [];
var filterKeyCompany = [];
var filterKeyCategory = [];
var companies_highlight = [];    // ハイライト対象の企業一覧
var VS_NUM = 2;            //比較数
var flgHighLight = false;           //強調表示中のフラグ（全表示、デフォルトはfalseへ）

    //フィルタキーの初期化
    function initFilterKey(){
        filterKeyArea = [];
        filterKeyCompany = [];
        filterKeyCategory = [];
    }
    //可視化フラグの初期化
    function initFlag(){
        for(var i=0; i<nCompanies; i++)
            companies_highlight[i] = false; //インデックスiがsheares[i]とリンク        
    }
    //全表示に戻す時
    function filterReset(){
        initFlag();
        initFilterKey();
        flgHighLight = false; //強調表示フラグの初期化
    }
    
    //カテゴリによるフィルタ
    function filterByCompanyCategory(keyCategory){
        //強調表示フラグON
        flgHighLight = true;
        
        //フィルタキー存在確認
        var flgAlready = false;
        for(var i=0; i<filterKeyCategory.length; i++)
            if(filterKeyCategory[i] == keyCategory)
                flgAlready = true;
        //フィルタキー追加（既出の時は何もしない）
        if(!flgAlready){
            if(filterKeyCategory.length == VS_NUM)
                filterKeyCategory.shift();  //先頭押出し
            filterKeyCategory.push(keyCategory);    //追加
            
            for(var i=0; i<nCompanies; i++){
                companies_highlight[i] = false; //一旦リセット
                for(var j=0; j<filterKeyCategory.length; j++)
                    if(companyData[i].category_us == filterKeyCategory[j])
                        companies_highlight[i] = true;                       
            }
        }
        
        //ボタンの強調表示(直接指定のもののみ)
        d3.selectAll("a").classed("highlight", false);  //一旦リセット
        for(var i=0; i<filterKeyCategory.length; i++){
            //空白入りのIDを指定するために置換
            var id_name = filterKeyCategory[i];
            id_name = id_name.replace(/ /g,'\\ ');
            d3.select("#filters_company_category")
                .select("a#" + id_name)
                .classed("highlight", true);
        }
        
        //強調表示
        setHighLight();
        //非強調表示
        setUnHighLight();
    }
    
    //企業IDによるフィルタ
    function filterByCompany(keyCompany){
        //強調表示フラグON
        flgHighLight = true;
        
        //フィルタキー存在確認
        var flgAlready = false;
        for(var i=0; i<filterKeyCompany.length; i++)
            if(filterKeyCompany[i] == keyCompany)
                flgAlready = true;
        //フィルタキー追加（既出の時は何もしない）
        if(!flgAlready){
            if(filterKeyCompany.length == VS_NUM)
                filterKeyCompany.shift();   //先頭押出し
            filterKeyCompany.push(keyCompany);  //追加
        
            for(var i=0; i<nCompanies; i++){
                companies_highlight[i] = false; //一旦リセット
                for(var j=0; j<filterKeyCompany.length; j++)
                    if(companyData[i].id == filterKeyCompany[j])
                        companies_highlight[i] = true;
            }
        }
        
        //ボタンの強調表示(直接指定のもののみ)
        d3.selectAll("a").classed("highlight", false);  //一旦リセット
        for(var i=0; i<filterKeyCompany.length; i++){
            d3.select("#filters_company")
                .select("a." + filterKeyCompany[i])
                .classed("highlight", true);
        }

        
        //強調表示
        setHighLight();
        //非強調表示
        setUnHighLight();
    }
    //エリアによるフィルタ
    function filterByArea(keyArea){
        //強調表示フラグON
        flgHighLight = true;

        //フィルタキー存在確認
        var flgAlready = false;
        for(var i=0; i<filterKeyArea.length; i++)
            if(filterKeyArea[i] == keyArea)
                flgAlready = true;
        

        //フィルタキー追加（既出の時は何もしない）
        if(!flgAlready){
            if(filterKeyArea.length == VS_NUM)
                filterKeyArea.shift();   //先頭押出し
            filterKeyArea.push(keyArea);  //追加
        
            
            //当該地域に属する企業のフラグをON
            for(var i=0; i<nCompanies; i++){
                companies_highlight[i] = false; //一旦リセット
                for(var j=0; j<filterKeyArea.length; j++){
                    var coutryList = getCompanyList(filterKeyArea[j]);//国名リスト取得
                    for(var k=0; k<coutryList.length; k++)
                        if(companyData[i].country_us == coutryList[k])
                            companies_highlight[i] = true;
                }
            }
        }
        
        //ボタンの強調表示(直接指定のもののみ)
        d3.selectAll("a").classed("highlight", false);  //一旦リセット
        for(var i=0; i<filterKeyArea.length; i++){
            d3.select("#filters_company")
                .select("a#" + filterKeyArea[i])
                .classed("highlight", true);
        }
        
        //強調表示
        setHighLight();
        //非強調表示
        setUnHighLight();
    }

    //指定地域に適合した国名フィルターを作成
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
    //全表示（通常表示）
    function setDisplayAll(){
        //非強調解除
        d3.selectAll(".dot").classed("un-highlight", false);
        d3.selectAll(".path").classed("un-highlight", false);
        d3.selectAll(".path2").classed("un-highlight", false);
        d3.selectAll(".area2").classed("un-highlight", false);
        d3.selectAll(".seek").classed("un-highlight", false);
        d3.selectAll(".seek-label").classed("un-highlight", false);
        d3.selectAll(".dot-label").classed("un-highlight", false);
        d3.selectAll(".dot-label_bg").classed("un-highlight", false);
        d3.selectAll(".dot-label2").classed("un-highlight", false);
        //強調解除
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

    //非強調表示
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

                //強調解除
                dot_unselected.classed("highlight", false);
                path_unselected.classed("highlight", false);
                path2_unselected.classed("highlight", false);
                area2_unselected.classed("highlight", false);
                seek_unselected.classed("highlight", false);
                seekLabel_unselected.classed("highlight", false);
                dotLabel_unselected.classed("highlight", false);
                dotLabel2_unselected.classed("highlight", false);
                button_unselected.classed("selected", false);
                
                //非強調
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
    
    //強調表示
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
                
                //非強調解除
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
                //強調
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
