////////
//referece : 
// http://www.delimited.io/blog/2013/12/19/force-bubble-charts-in-d3
////////
var SRC_URL1 = "http://localhost/data/world-110m.json";
var SRC_URL2 = "http://localhost/data/world-110m-country-names.tsv";
var SRC_URL3 = "http://localhost/data/FinancialData.json";
var SRC_URL4 = "http://localhost/data/CompanyData.json";
var SRC_URL5 = "http://localhost/data/CurrencyRate.json";
var langKey;
var currency;

//言語設定
function setLangKey(_langKey){
    //"Japan" or "English";
    langKey = _langKey;        
}

var mapWidth = 1200,
mapHeight = 500,
GlobeMode = true,
animation = false,
clipMode = false,
clusterMode = false,    //クラスタモードフラグ
speed = 1e-2,
lon360_now = 0,     //表示回転角（0－360正規化）
lon_now = 0,        //表示回転角（正規化なし）
start360 = Date.now(),
start = Date.now(),
angle_offset = 0,
temp = angle_offset,
timeDelay = 0,      //変形アニメーション中の経過時間
increAngle = 36,    //回転角/年
flgFirst = true,    //初回回転フラグ
timer_ret_val = false,//タイマー制御
flgEnd = false;     //終了フラグ

//アニメーションパラメータ
var INIT_ROTATION_TIME = 500;  //回転角を戻すアニメーション時間
var EXPAND_MAP_TIME = 1000;     //地図展開アニメーション時間

//書式設定
var formatT = d3.format(".1f");
var formatT2 = d3.format(".2f");

var projectionGlobe = d3.geo.orthographic()
.scale(500)
.center([-mapWidth/2, 0])
.translate([mapWidth-200, mapHeight])
.clipAngle(90);

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

    var countryById = {};
    var land = topojson.feature(world, world.objects.land);
    var borders = topojson.mesh(world, world.objects.countries, function(a, b) {
        return a !== b;
    });
    var indicatices = d3.merge(
        d3.range(-180,181,30).map(function(lon) { 
        return d3.range(-60,61,30).map(function(lat) { 
            // lon : 経度　→　中心座標
            // lat : 緯度　→　中心座標
            // r : 円を描く角度　→　半径
            var r = 7.0;
            return d3.geo.circle().origin([ lon, lat ]).angle(r)();
        }); 
    })
    );
    
    //データ作成
    var nCompanies = financialData.length;
    var nFY = financialData[0].assets.length;
    var startYear = financialData[0].assets[0][0];
    var endYear = financialData[0].assets[nFY-1][0];
    var currYear = startYear;
    var currYearF = startYear;
    var currIndex = 0;
    var currIndexF = 0.0;
    var padding = 20;    //バブル用
    var maxRadius = 80; //バブル用
    //総資産の最大値
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
    
    //バブルのスケール設定
    var rScale = d3.scale.sqrt().domain([0, maxAssets]).range([0, 10]);
    var rScale2D = d3.scale.sqrt().domain([0, maxAssets]).range([0, 30]);
    var colorScale = d3.scale.linear()
                .domain([0,0.3])
                .interpolate(d3.interpolateRgb)
                .range(["#1cd2d2", "#E551FA"]);
                                              
    //3D用円追加
    canvas.selectAll("path")
        .data(financialData)
      .enter().append("path")
        .attr("class", "tissot");

    //2D用円追加
    var bubbles = info_svg.selectAll("circle")
        .data(financialData)
        .enter().append("circle")
        .attr("class", "bubbles");
    
    // 地球の緯度経度グリッドの座標を出す。
    // stepでグリッドの幅。デフォルトは[10,10]で10度ずつ。
    var graticule = d3.geo.graticule().step([10,10]);

    // 緯度経度グリッド追加
    var glids = canvas.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);
    
    //引き出し線追加
    var cLines;
    addcLines();
    
    //ラベルグループ追加
    var cLabels = info_svg.selectAll("g")
        .data(financialData)
        .enter().append("g")
        .attr("class", "cLabels");
    //企業名ラベル追加
    cLabels.append("text")
        .attr("class", "companyLabel")
        .attr("dy", "-1em");
    //総資産ラベル追加
    cLabels.append("text")
        .attr("class", "assetLabel");
        
    //年ラベル追加
    var yLabel = info_svg.append("svg:text")
        .attr("class", "yearLabel")
        .attr("dy", "1em");

    //デバッグ表示
    var debug = info_svg.append("svg:text")
        .attr("class", "debugLabel")
        .attr("dy", "2em");
    
    //透視投影方式
    var globe2map = interpolatedProjection(projectionGlobe, projectionMap);
    var map2globe = interpolatedProjection(projectionMap, projectionGlobe);

    //バブル位置初期化
    initBubble2DPos();
    
    //クラスタ中心座標
    var getCenters = function(key, size) {
        var centers, map;
        var sort_idx = 0;
        centers = _.uniq(_.pluck(companyData, key))
                .map(function(d) {
                    sort_idx++;
                    return {name: d, value: 1, sort_key: sort_idx};
                });
        
        //逆順へ
        if(key=="area_jp" || key=="area_us")
            centers.sort(function(a,b){
            return d3.descending(a.sort_key, b.sort_key);
        });
        
        map = d3.layout.treemap().size(size).ratio(-1/1);
        map.nodes({children: centers});

        return centers;
    };
    
    //力学的レイアウト
    var force = d3.layout.force();
    
    //イベント
    bubbles.on("mouseover", function(d) {
            if(clusterMode || GlobeMode === false)
                showPopover.call(this, d);
        })
        .on("mouseout", function(d) {
            if(clusterMode || GlobeMode === false)
                removePopovers();
        });
    
    $(".btn").click(function() {
        switch(this.id){
            case "3DMap":
                if(clusterMode){
                    //直前までクラスタモードだった場合
                    addcLines();
                }
                clusterMode = false;
                removeLabelCluster();
                if(GlobeMode){
                    //直前まで3Dモードだった場合
                    //変形なし
                }else{
                    //直背まで2Dモードだった場合
                    TransformProjection();  //3D変形
                }
                break;
            case "2DMap":
                if(clusterMode){
                    //直前までクラスタモードだった場合
                    addcLines();
                }
                clusterMode = false;
                removeLabelCluster();
                initBubble2DPos();
                if(GlobeMode){
                    //直前まで3Dモードだった場合
                    TransformProjection();  //2D変形
                }else{
                    //直前まで2Dモードだった場合
                    //変形なし
                }
                break;
            case "area_us":
            case "area_jp":
            case "category_us":
            case "category_jp": 
                removecLines();
                if(GlobeMode){
                    //直前まで3Dモードだった場合
                    TransformProjection();  //2D変形
                }else{
                    //直前まで2Dモードだった場合
                    //変形なし
                }                
                clusterMode = true;
                drawCluster(this.id);    //HTMLのid = keyとなるようにしておく                
                break;
            default:
                break;
        }
    });
    
    //時間制御
    d3.timer(function() {
        if(animation === false){
            //経度の設定
            lon_now = speed * (Date.now() - start - timeDelay);      //正規化なし
            lon360_now = lon_now - (360 * Math.floor(lon_now / 360));    //0～360度に正規化
            
            if(flgEnd === false){
                //小数点版
                currYearF = startYear + lon_now / increAngle;
                currIndexF = lon_now / increAngle;

                //整数版
                currYear = Math.floor(currYearF);   //小数点切り捨て
                currIndex = Math.floor(currIndexF);   //小数点切り捨て
            }
            
            //終了時
            if(currYear >= endYear){
                //timer_ret_val = true;   //タイマー終了
                flgEnd = true;          //終了フラグON
                currYearF = endYear;
                currIndex = nFY-1;
                currIndexF = currIndex;
                /*
                if(GlobeMode === true)
                    TransformProjection();  //マップ変形
                */
            }

            //回転
            if(GlobeMode === true)
                projection.rotate([lon360_now, 0]);

            //コンテンツ表示
            viewMapContents();
            viewInfoContents(lon360_now);
        }else{
            //コンテンツ表示
            viewInfoContents(lon360_now);               
        }
        return timer_ret_val;
    });

    //バブル2DMap表示位置初期化
    function initBubble2DPos(){
        for(var i=0; i<financialData.length; i++){
            financialData[i].radius = 0;
            financialData[i].x = projection(getPrintLocation(financialData[i].id))[0];
            financialData[i].y = projection(getPrintLocation(financialData[i].id))[1];
        }
    }
    
    //地図変形
    function TransformProjection() {    
        animation = true;   //変形中フラグON
        var transform_start_time = Date.now();  //変形開始時の時刻記録
        
        //地図の透視投影方式を3Dから2Dへ
        if (GlobeMode === true) {
            GlobeMode = false;
            
            //(1)回転角を初期位置へ
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

            //(2)変形アニメーション
            setTimeout(function() {
                projection = globe2map;
                path.projection(projection);
                clipMode = false;

                //(2-1)変形中の表示
                d3.transition()
                .duration(EXPAND_MAP_TIME)
                .tween("projection", function() {
                  return function(_) {
                    projection.alpha(_);
                      viewMapContents();
                  };
                });

                //(2-2)変形後の表示
                setTimeout(function(){
                    animation = false;   //変形中フラグOFF
                    timeDelay += Date.now() - transform_start_time;  //変形時間分を遅延時間として記録
                    viewInfoContents(0);
                }, EXPAND_MAP_TIME+100);

            }, INIT_ROTATION_TIME);

        } else {            
            projection = map2globe;
            path.projection(projection);
            clipMode = true;

            //(1)変形中の表示
            d3.transition()
            .duration(EXPAND_MAP_TIME)
            .tween("projection", function() {
              return function(_) {
                projection.alpha(_);
                  viewMapContents();
              };
            });
            
            //(2)回転角を元の位置へ
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
            
            //(3)変形後の表示
            setTimeout(function(){
                animation = false;   //変形中フラグOFF
                GlobeMode = true;
                timeDelay += Date.now() - transform_start_time;  //変形時間分を遅延時間として記録
            }, INIT_ROTATION_TIME+EXPAND_MAP_TIME+100);

        } 
    }

    //地図
    function viewMapContents(){

        context.save(); // 描画パラメータの保存（初期状態＝指定なし）

        context.clearRect(0, 0, mapWidth, mapHeight);
        
        if(GlobeMode){
        //グリッド線
        context.beginPath();
        context.strokeStyle = "#555";
        canvas.selectAll("path.graticule")
        .datum(graticule)
        .attr("d", path);
        context.stroke();
        context.restore();  //初期状態に戻す
        context.save();     //再び保存
        }
        
        //大陸
        context.beginPath();
        context.fillStyle = "#333";//"#E6E6E6";
        path(land);        
        context.fill();
        context.restore();  //初期状態に戻す
        context.save();     //再び保存
    }
    //情報
    function viewInfoContents(_lon360_now){
                        
        //年ラベル
        yLabel.text(currYear);    

        /*
        //デバッグ
        debug.text("回転角[deg]: " + formatT2(_lon360_now) + 
                   "　　経過時刻[ms]: " + (Date.now() - start360) + 
                   //"　　開始時刻: " + start360 +
                   "　　遅延時間[ms]: " + timeDelay + 
                   "　　currIndex: " + currIndex + 
                   "　　currIndexF: " + formatT2(currIndexF) + 
                   "　　currYear: " + currYear + 
                   "　　currYearF: " + formatT2(currYearF));
        */
        
        //円
        if(GlobeMode){
            //地球儀のとき
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
            context.restore();  //初期状態に戻す
            context.save();     //再び保存
        }else{
            //平面図のとき   
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
        
        //引き出し線
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
        
        //ラベルグループ
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

        
        
        //企業名ラベル
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
        
        //総資産ラベル
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
                    formatT(currAsset/1e6) + "兆円" : 
                    formatT(currAsset/1e3) + "B$";
            else
                return "";  //0の時は何も表示しない
            });            

    }
    
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
    
//可視化制御
function isVisible(companyId, angle, _currIndex){
    var _lon = getPrintLocation(companyId)[0];
    var lon360; //360度変換後の経度
    if(_lon < 0) lon360 = -_lon;        //西経
    if(_lon > 0) lon360 = 360 - _lon;   //東経

    //回転角による制御
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
    
    //投影モードによる制御
    if(GlobeMode === false)
        flg = true;
    
    //変形中による制御
    if(animation === true)
        flg = false;
    
    //データ有無による制御(次年度からデータがある場合には表示開始)
    var _nextIndex = (_currIndex < nFY - 1) ? _currIndex + 1 : _currIndex;
    var _asset = getAssetF(companyId, _nextIndex, _nextIndex);
    if(_asset == 0)
        return false;
    else
        return flg;
};

//補間＆換算した総資産を返す
function getAssetF(companyId, _currIndexF, _currIndex){
    
    //通貨レート
    var lastRate, nextRate;    
    var _nextIndex = (_currIndex < nFY - 1) ? _currIndex + 1 : _currIndex;
    
    if(langKey == "Japan"){
        //円
        lastRate = currency_rate("USD/YEN", _currIndex);
        nextRate = currency_rate("USD/YEN", _nextIndex);
    }else{
        //ドル
        lastRate = 1.0;
        nextRate = 1.0;                
    }
    //総資産取得
    for(var i=0; i<financialData.length; i++){
        if(financialData[i].id == companyId){
            var lastAsset = financialData[i].assets[_currIndex][1] / lastRate;
            var nextAsset = financialData[i].assets[_nextIndex][1] / nextRate;
        }
    }
    //比率
    var weight = _currIndexF - _currIndex;
    
    //補間
    return nextAsset*weight + lastAsset*(1-weight);
};
    
//緯度経度を返す
 function getLocation(companyId){
     for(var i=0; i<companyData.length; i++){
        if(companyData[i].id == companyId){
            return [companyData[i].lon, companyData[i].lat];  //正式な緯度経度
        }
     }
 };

//表示用にばらけさせた緯度経度を返す
 function getPrintLocation(companyId){
     for(var i=0; i<companyData.length; i++){
        if(companyData[i].id == companyId){
            return [companyData[i].print_lon, companyData[i].print_lat];
        }
     }
 };

//通貨レート
function currency_rate(_key, _yIndex){    
    for (var i = 0; i < currencyData.length; i++)
        if (currencyData[i].currency == _key)
            return currencyData[i].value[_yIndex].rate;
}

//変化率
function change_rate(_id, _yIndex){
   for (var i=0; i< financialData.length; i++){
       if (financialData[i].id == _id){
           var currAssets = financialData[i].assets[_yIndex][1];
           //var nextAssets = financialData[i].assets[_yIndex > 0 ? _yIndex - 1 : 0][1];
           var nextAssets = financialData[i].assets[(_yIndex < nFY - 1) ? _yIndex + 1 : _yIndex][1];
           
           if(currAssets == 0)
               return 0.0;  //前年度データなしの場合＝変化なし
           else
               return (nextAssets - currAssets) / currAssets;
       }
    }
}

//クラスタ表示
function drawCluster(key) {
    //クラスタ中心
    var centers = getCenters(key, [mapWidth-100, mapHeight]);
    //力学的レイアウトアルゴ適用
    force.on("tick", tick(centers, key));
    //クラスタラベル表示
    labelCluster(centers);
    //レイアウト自動描画開始
    force.start();
}

//レイアウトアルゴリズム
function tick (centers, key) {
    var foci = {};
    for (var i = 0; i < centers.length; i++) {
        foci[centers[i].name] = centers[i];
    }
    return function (e) {
        for (var i = 0; i < financialData.length; i++) {
            var o = companyData[i];  //各企業データ
            var p = financialData[i];   //決算データ
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

//引き出し線表示関数
function addcLines(){
    cLines = info_svg.selectAll("path")
        .data(financialData)
        .enter().append("path")
        .attr("class", "cLines");
}
    
//引き出し線非表示関数
function removecLines(){
    cLines.remove();
}
//クラスタラベル表示関数
function labelCluster (centers) {
    info_svg.selectAll(".labelCluster").remove();

    info_svg.selectAll(".labelCluster")
        .data(centers).enter().append("text")
        .attr("class", "labelCluster")
        .text(function (d) { return d.name })
        .attr("transform", function (d) {
            //表示位置はceters.x, centers.yにあるものとする
            return "translate(" + (d.x + (d.dx / 2)) + ", " + (d.y + 80) + ")";
        });
}

//クラスタラベル非表示関数
function removeLabelCluster(){
    info_svg.selectAll(".labelCluster").remove();
}
//ポップアップラベル非表示関数
function removePopovers () {
    $('.popover').each(function() {
        $(this).remove();
    }); 
}

//ポップアップラベル表示関数
function showPopover (d) {
    $(this).popover({
        placement: 'auto top',
        container: 'body',
        trigger: 'manual',
        html : true,
        content: function() { 
            return  (langKey=="Japan") ?
            "会社名: <val>" + d.name_jp + "</val>" + 
            "<br/>株式市場: <val>" + d.market + "</val>" + 
            "<br/>銘柄コード: <val>" + d.symbol + "</val>" + 
            "<br/>タイプ: <val>" + d.category_jp + "系</val>" + 
            "<br/>本社所在国: <val>" + d.country_jp + "</val>" + 
            "<br/>従業員数: <val>" + d.employee + "</val>" + 
            "<br/>売上高[B$]: <val>" + formatT(d.revenue[currIndex][1]/1e3) + "</val>" + 
            "<br/>営業利益[B$]: <val>" + formatT(d.profit[currIndex][1]/1e3) + "</val>" + 
            "<br/>総資産[B$]: <val>" + formatT(d.assets[currIndex][1]/1e3) + "</val>" + 
            "<br/>時価総額[B$]: <val>" + formatT(d.capital[currIndex][1]/1e3)
            :
            "NAME: <val>" + d.name_us + "</val>" + 
            "<br/>MARKET: <val>" + d.market + "</val>" + 
            "<br/>SYMBOL: <val>" + d.symbol + "</val>" + 
            "<br/>TYPE: <val>" + d.category_us + "</val>" + 
            "<br/>HQ Country: <val>" + d.country_us + "</val>" + 
            "<br/>EMPLOYEE: <val>" + d.employee + "</val>" + 
            "<br/>REVENUE[B$]: <val>" + formatT(d.revenue[currIndex][1]/1e3) + "</val>" + 
            "<br/>OPT. PROFIT[B$]: <val>" + formatT(d.profit[currIndex][1]/1e3) + "</val>" + 
            "<br/>ASSETS[B$]: <val>" + formatT(d.assets[currIndex][1]/1e3) + "</val>" + 
            "<br/>MARKET CAP.[M$]: <val>" + d.capital[currIndex][1]
            ; 
        }
    });
    $(this).popover('show')
}

//レイアウトアルゴ補助関数
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


};

