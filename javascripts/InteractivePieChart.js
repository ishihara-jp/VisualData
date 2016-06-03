////////////////
//Global Var. //
////////////////

//var localPrefix = "http://localhost/";
var localPrefix = "";

var SRC_URL1 = localPrefix + "data/CompanyData.json";
var SRC_URL2 = localPrefix + "data/MarketShareData.json";
var SRC_URL3 = localPrefix + "data/MarketShareData_en.json";

var companies;  //企業データ
var shares;     //市場シェアデータ
var nCharts;    //チャート数
var nCategories;    //カテゴリ数
var nCompanies;     //企業数
var nRanks;     //ランキング数
var c_width;    //チャート幅
var c_height;   //チャート高さ
var c_marginW = 10;  //チャート間隔(横)
var c_marginH = 30;  //チャート間隔(縦)
var s_margin = 35;  //グラフ全体の上下左右の間隔
var isAnimated = false; // アニメーション終了の判定フラグ

var companies_highlight = [];    // ハイライト対象の企業一覧
var charts_highlight = [];       // ハイライト対象のチャート一覧
var isHighLighted = false;       // ハイライト表示中の判定フラグ
var isFilterGroup = false;      // グループ指定フラグ
var startChartNo;    //表示する最初チャート番号
var endChartNo;    //表示する最後チャート番号
var nCOL;  //チャート列数
var ANM_DELAY = 500;
var ANM_DULATION = 1000;
var ANM_TEXT_DULATION = 2500;
var TH_RATE = 5;    //引き出しラベルの閾値[%]

var langKey;
function setLangKey(_langKey){
    langKey = _langKey;        
}

//format
var formatT0 = d3.format(".0f");
var formatT1 = d3.format(".1f");
var formatT2 = d3.format(".2f");

//Loading data
queue()
.defer(d3.json, SRC_URL1)
.defer(d3.json, SRC_URL2)
.defer(d3.json, SRC_URL3)
.await(ready);


// サイズを設定
// ウィンドウサイズによって可変する
var size = {
    //16:9
    width : 1280,
    height: 720

/*
    //4:3
    width : 1024,
    height: 768
*/
};

// 配色
// 参考：http://paletton.com/
var c_pallet = [
    ["#051B38", "#143054", "#2B4970", "#4C688B", "#748BA7", "#C7C7C7"],
    ["#012B35", "#0F434F", "#255C69", "#447784", "#6B949E", "#C7C7C7"],
    ["#003925", "#0E553C", "#267257", "#478E75", "#72AB97", "#C7C7C7"],
    ["#0F4800", "#256B12", "#448F30", "#6CB359", "#9ED78F", "#C7C7C7"],
    ["#525500", "#7C7F15", "#A6A938", "#D1D36A", "#FCFEA9", "#C7C7C7"],
    ["#40250E", "#754720", "#AA6C39", "#DF9557", "#FFB272", "#C7C7C7"],
    ["#400E0F", "#742022", "#A8383B", "#DD565A", "#FD7175", "#C7C7C7"],
    ["#330B23", "#5D1A41", "#872D62", "#B14584", "#D860A6", "#C7C7C7"],
    ["#210B2B", "#3E184E", "#5B2971", "#7A3E94", "#A05ABE", "#C7C7C7"],
    ["#150E2C", "#2A1D51", "#413075", "#5B4699", "#7B63C3", "#C7C7C7"]
];


// d3用の変数
var win   = d3.select(window), //←リサイズイベントの設定に使用します
    cnv   = d3.select("#charts").attr("width", size.width).attr("height", size.height),
    pie   = d3.layout.pie().sort(null).value(function(d){ return d.share; }),
    arc   = d3.svg.arc();
    outerArc = d3.svg.arc();
    sampleline = d3.svg.line()
          .x(function(d) {return d[0];})
          .y(function(d) {return d[1];});        // line関数を定義 (x,y)は配列の[0],[1]とする。

//load company data
function ready(error, companyData, shareData, shareData_en) {
    
    companies = companyData;
    nCompanies = companyData.length;
    shares = (langKey=="Japan") ? shareData : shareData_en;
    
    //品目カテゴリ
    categories = (langKey=="Japan") ? 
        ["電子部品","半導体","白物家電","エネルギー","医療","モバイル・パソコン","情報システム","デジタル家電","産業機械","受託製造"]
        :
        ["Electronic components","Semiconductor/Material","Home appliances","Electric power","Medical","Smart device","Computer technology","Digital appliances","Industrial machine","Manufacturing"];
         
    //スタート
    drawPie(0);
};

// グラフの描画
// 描画処理に徹して、サイズに関する情報はupdate()内で調整する。
function render(){
    //一旦全消去
    d3.select("#charts").selectAll("g").remove();
    
    var i;
    for(i=startChartNo; i<nCharts; i++){
        var chart_no = shares[i].chart_no;
        var category_no = shares[i].category_no;
        var ranks = shares[i].chart_item;
        var title = shares[i].total_title;
        var volume = shares[i].total_volume;
        var volume_unit = shares[i].total_volume_unit;
        var volume_aspect = shares[i].total_aspect;
                
        // -----グラフ全体-----
        var chart = cnv.append("g")
            .attr("class", "chart" + chart_no);
        
        // -----パイ------
        var w_pie = chart.append("g")
            .attr("class", "pie");
        
        // -----矩形領域------
        w_pie.append("rect")
            .attr("class", "category");

        // -----円弧------
        //円弧グループ作成
        var arcs = w_pie.append("g")
                .attr("class", "arcs");
        // 円弧作成
        arcs.selectAll(".arc")
            .data(pie(ranks))
            .enter()
            .append("path")
            .attr("class", function(d){
                return "arc " + ((d.data.company_id == "OTHER") ? d.data.company_country : d.data.company_id); 
        })
            .on("click", function(){
                var selected_Arc = d3.select(this);
                selected_Arc.classed('un-highlight', false);
                selected_Arc.classed('highlight', false);
                var className = selected_Arc.attr("class");
                var company_id = className.substr(4, className.length);
                filterByCompany(company_id);
        });

        // データのセット
        var maxValue = d3.max(ranks,function(d){
            return d.share; 
        });

        // -----ラベル------
        // ラベルグループ作成
        var labels = w_pie.append("g")
            .attr("class", "labels");
        //ラベル作成
        labels.selectAll(".label_bg")
            .data(pie(ranks))
            .enter()
            .append("text")
            .attr("class", function(d){ return "label_bg " + d.data.company_id; })
            .attr("dy", ".35em")
            .attr("opacity", "0")
            .attr("stroke-linejoin", "round")
            .text(function(d){
                var company = d.data.company_name;
                return company == "その他" ? null : company; 
            });
        labels.selectAll(".label")
            .data(pie(ranks))
            .enter()
            .append("text")
            .attr("class", function(d){ return "label " + d.data.company_id; })
            .attr("dy", ".35em")
            .attr("opacity", "0")
            .text(function(d){
                var company = d.data.company_name;
                return company == "その他" ? null : company; 
            });
        
        // -----引き出し線------
        // 引き出し線グループ作成
        var lines = w_pie.append("g")
                    .attr("class", "lines");
        //引き出し線作成
        lines.selectAll(".line")
            .data(pie(ranks))
            .enter()
            .append("polyline")
            .attr("class", "line")
            .attr("opacity", "0");
        
        // -----中心ラベル-----
        var c_label = w_pie.selectAll(".c_label")
                    .data([volume])
                    .enter()
                    .append("text")
                    .attr("class", "c_label")
                    .text(function(d){ return volume == "null" ? "" : "0"; });
        var c_label2 = w_pie.append("text")
                    .text(function(d){
                        return volume_aspect == "null" ? "" : volume_aspect + "[" + volume_unit + "]"; })
                    .attr("class", "c_label2");
        
        // -----グラフタイトル------
        //キャプショングループ作成
        var caption = chart.append("g")
            .attr("class", "caption");
        
        //凡例作成
        caption.append("text")
            .attr("class", "sample_label")
            /*.attr("dy", "1.2em")*/
            .attr("opacity", "0.5")
            .attr("fill", function(d){ return c_pallet[category_no-1][1]; })
            .text(categories[category_no-1])
            .style("text-anchor", "middle");
        
        caption.append("path")
            .attr("class", "sample_color")
            .attr("stroke", function(d){ return c_pallet[category_no-1][0]; })
            .attr("opacity", "0.3");        
        
        //タイトル作成
        caption.append("text")
            .attr("class", "title")
            /*.attr("dy", "2.0em")*/
            .style("text-anchor", "middle")
            .text(title)
            .attr("opacity", "0");
        
    }
}


// グラフのサイズを更新
function update(){

    function midAngle(d){
        return d.startAngle + (d.endAngle - d.startAngle)/2;
    }
    
    // 自身のサイズを取得する
    size.width = parseInt(cnv.style("width"));
    size.height = parseInt(cnv.style("height"));
    // 取得したサイズを元にキャンバスを拡大・縮小させる
    cnv
        .attr("width", size.width)
        .attr("height", size.height);

    // グラフのサイズ取得
    c_width = (size.width - s_margin*2) / nCOL - 2 * c_marginW;
    c_height = c_width; //円なので
    
    var i=0, j=0, k=0;
    for(i=startChartNo; i<nCharts; i++){
        var chart_no = shares[i].chart_no;
        var category_no = shares[i].category_no;
        var ranks = shares[i].chart_item;
        var radius = c_width / 2;
        var chart = cnv.select(".chart" + chart_no);
        var w_pie = chart.select(".pie");
        var category = chart.select("rect");
        var caption = chart.select(".caption");
        var c_label = chart.select(".c_label");
        var c_label2 = chart.select(".c_label2");
        var sample_line = caption.select(".sample_color");
        var sample_label = caption.select(".sample_label");
        var title = caption.select(".title");
        var base_font_size = c_width/15;    //ベースとする相対フォントサイズ(5px)
        // -----パイ------
        // 円グラフの外径を更新
        arc
            .outerRadius(radius * 0.8)
            .innerRadius(radius * 0.5);
        outerArc
            .outerRadius(radius * 0.9)
            .innerRadius(radius * 0.8);        
        
        //円グラフの配置とリサイズ
        var cx = j*(c_width+2*c_marginW) + c_width/2 + c_marginW + s_margin,
            cy = k*(c_height+2*c_marginH) + c_height/2 + c_marginH;
        w_pie
            .attr("width", c_width)
            .attr("height", c_height)
            .attr("transform", "translate(" + cx + "," + cy + ")");
        
        //円グラフの着色
        w_pie.selectAll(".arc")
            .attr("stroke", "white")
            .attr("fill", function(d){ return c_pallet[category_no-1][d.data.rank-1]; })
                
        //キャプションの配置
        c_label
            .attr("dy", function(d) { return base_font_size*1; })
            .attr("font-size", function(d) { return base_font_size*2.5; });
        c_label2
            .attr("dy", "1em")
            .attr("font-size", function(d) { return base_font_size*0.8; })
            .attr("transform", function(d){
                    return "translate(0," + c_label.node().getBBox().height/2 + ")";
                });
            
        //グラフタイトルの配置
        var tx = j*(c_width+2*c_marginW) + c_width/2 + c_marginW + s_margin,
            ty = k*(c_height+2*c_marginH) + c_height + c_marginH;
        caption.attr("transform", "translate(" + tx + "," + ty + ")");
        
        //凡例の配置
        var s_pt = [-(c_width/2-20), base_font_size*0.5];//始点(x,y)
        var e_pt = [(c_width/2-20), base_font_size*0.5];//終点(x,y)
        var pt = [s_pt, e_pt];//samplelineの引数用に整形
        sample_line.attr("d",sampleline(pt));
        sample_label.attr("font-size", function(d){ return base_font_size*0.9; });
        title
            .attr("transform", "translate(0," + base_font_size*2.5 + ")") 
            .attr("font-size", function(d) { return base_font_size*1.8; });
        
        if((j+1)%nCOL==0 && j!=0){
            j=0;
            k++;
        }else{
            j++;
        }
        // パイのサイズを調整
        // アニメーションが終了していない場合はサイズを設定しないように
        if( isAnimated ){
            //w_pie.selectAll(function(d){ return ".arc." + d.data.company_id; })
            w_pie.selectAll(".arc")
                .attr("d", arc);
        }

        // -----ラベル------
        var labels = w_pie.select(".labels");
        labels.selectAll("text")
            .attr("transform", function(d){
                var rate = d.data.share;
                var pos = rate > TH_RATE ? arc.centroid(d) : outerArc.centroid(d);
                pos[0] = rate > TH_RATE ? pos[0] :radius * 0.85 * (midAngle(d) < Math.PI ? 1 : -1);
                return "translate(" + pos + ")"; 
            })
            .style("text-anchor", function(d){
                var rate = d.data.share;            
                return rate > TH_RATE ? "middle" : midAngle(d) < Math.PI ? "start" : "end";
            })
            .attr("font-size", function(d){ return base_font_size*0.7; });
        
        // -----引き出し線------
        var lines = w_pie.select(".lines");
        lines.selectAll("polyline")
            .attr("points", function(d){
                var rate = d.data.share;
                var company = d.data.company_name;
                var pos = outerArc.centroid(d);
                pos[0] = radius * 0.8 * (midAngle(d) < Math.PI ? 1 : -1);
                return (rate > TH_RATE) || (company == "その他") ? [0,0,0,0] : [arc.centroid(d), outerArc.centroid(d), pos];
        });
    }
}


// グラフのアニメーション設定
function animate(){
    //円弧のアニメーション
    var arcs = cnv.selectAll(".arc"),
    i = 0,
    j = 0;
    arcs
        .transition()
        .ease("cubic-out")
        .delay(ANM_DELAY)
        .duration(ANM_DULATION)
        .attrTween("d", function(d){
            var interpolate = d3.interpolate(
                {startAngle: 0, endAngle: 0},
                {startAngle: d.startAngle, endAngle: d.endAngle}
            );
            return function(t){ return arc(interpolate(t)); };
        })
        .each("end", function(transition, callback){
            i++;
            isAnimated = i === nRanks * nCharts; //最後のArc要素の時に来たらtrueへ
        });

    //テキストラベルのアニメーション
    cnv.selectAll(".label_bg")
    .transition()
    .delay(ANM_DELAY+ANM_DULATION)
    .duration(ANM_TEXT_DULATION)
    .attr("opacity", 100);
    cnv.selectAll(".label")
    .transition()
    .delay(ANM_DELAY+ANM_DULATION)
    .duration(ANM_TEXT_DULATION)
    .attr("opacity", 100);

    //引き出し線のアニメーション
    cnv.selectAll(".line")
    .transition()
    .delay(ANM_DELAY+ANM_DULATION)
    .duration(ANM_TEXT_DULATION)
    .attr("opacity", 100);

    //タイトルのアニメーション
    cnv.selectAll(".title")
    .transition()
    .duration(ANM_TEXT_DULATION)
    .attr("opacity", 100);
    
    //中心ラベルのアニメーション
    cnv.selectAll(".c_label")
    .transition()
    .delay(ANM_DELAY)
    .duration(ANM_DULATION)
    .tween("text", function(d) {
        if(d=="null") return "";
        var i = d3.interpolate(this.textContent, d),
            prec = (d + "").split("."),
            round = (prec.length > 1) ? Math.pow(10, prec[1].length) : 1;
        return function(t) {
            var volume = Math.round(i(t) * round) / round;
            this.textContent = (langKey=="Japan")? volume : formatT1(volume);
        };
    });  
}

//可視化フラグの初期化
function setFlag(){
    var i,j;    
    for(i=0; i<nCharts; i++)
        charts_highlight[i] = false;    //インデックスiがcompanies[i]とリンク
    for(i=0; i<nCompanies; i++)
        companies_highlight[i] = false; //インデックスiがsheares[i]とリンク
    isHighLighted = false;
    isFilterGroup = false;
    isAnimated = false;
}


function drawPie(select_category_no){
    
    setParam(select_category_no);
    setFlag();
    render();
    update();
    animate();
    win.on("resize", update); // ウィンドウのリサイズイベントにハンドラを設定
    
}

function setParam(select_category_no){
    //表示する品目の制御
    var count = 0;
    var flgFirstTime = true;
    if(select_category_no == 0){
        nCharts = shares.length;
        startChartNo = 0;
        endChartNo = nCharts;
        nCOL = 10;
    }else{
        for(var i=0; i<shares.length; i++){
            if(shares[i].category_no == select_category_no){
                if(flgFirstTime){
                    startChartNo = shares[i].chart_no - 1;
                    flgFirstTime = false;
                }
                endChartNo = shares[i].chart_no;
                count++;
            }
        }
        nCharts = endChartNo;
        nCOL = nCharts > 4 ? 4 : nCharts;
    }
    
    nRanks = shares[0].chart_item.length;    
    nCategories = categories.length;
}

function filterByArea(area_id) {
    //指定地域に適合した国名フィルターを作成
    var filter;
    switch(area_id){
        case "JAPAN":
            filter = ["Japan"];
            break;
        case "USA":
            filter = ["USA"];
            break;
        case "EU":
            filter = ["Germany", "Swedish", "Netherlands", "Finland", "Denmark", "French"];
            break;
        case "ASIA":
            filter = ["China", "Tiwan", "Korea"];
            break;
        case "OTHER":
            filter = ["Canada", "Russia"];
            break;
        default:
            filter = [];
            break;
    }
    
    //当該地域に属する企業を特殊ハイライト
    for(var i=0; i<nCompanies; i++){
        for(var j=0; j<filter.length; j++){
            if(companies[i].country_us == filter[j]){
                //フラグON
                companies_highlight[i] = true;
            }
        }
    }

    isFilterGroup = true;

    filterByChart();
    setHighLight();
    //企業リストに無いその他の企業の可視化
    setOther(filter);
}

function setOther(filter){
    var i;
    for(i=0; i<filter.length; i++){
        var company_country = filter[i];
        var arc_other = d3.selectAll(".arc." + company_country);
        if(!arc_other.empty()){
            if(isHighLighted){
                arc_other.classed('un-highlight', false);
                arc_other.classed('highlight', true);
            }else{
                arc_other.classed('un-highlight', false);
                arc_other.classed('highlight', false);
            }
        }
    }
}

function filterByProductCategory(product_category_id) {    
    drawPie(product_category_id);
}

function filterByCompanyCategory(company_category_id) {    
    
    //当該カテゴリに属する企業を特殊ハイライト
    for(var i=0; i<nCompanies; i++){
        if(companies[i].category_us == company_category_id){
            //フラグON
            companies_highlight[i] = true;
        }
    }

    isFilterGroup = true;
    
    filterByChart();
    setHighLight();
}

function filterByCompany(company_id){
    //該当企業のフラグをON
    var i, j;
    for(i=0; i<nCompanies; i++){
        if(companies[i].id == company_id){
            companies_highlight[i] = true;
        }
    }
    
    filterByChart();
    setHighLight();
    
    //中心ラベル表示
    setCenterLabel(company_id);
}

function setCenterLabel(company_id){
    var i,j;    
    if(isHighLighted){
        for(i=startChartNo; i<nCharts; i++){
            if(charts_highlight[i]){
                var chart_no = shares[i].chart_no;
                var c_label = d3.select(".chart" + chart_no).select(".c_label");
                var c_label2 = d3.select(".chart" + chart_no).select(".c_label2");
                c_label.text(function(d){
                        for(j=0; j<nRanks; j++){
                            if(shares[i].chart_item[j].company_id == company_id){
                                return (langKey=="Japan") ? 
                                    "第" + shares[i].chart_item[j].rank + "位"
                                    :
                                    shares[i].chart_item[j].rank;
                            }
                        }
                    });
                c_label2.text(function(d){
                    return (langKey=="Japan") ? "" : "Rank";
                    /*
                    for(j=0; j<nRanks; j++){
                        if(shares[i].chart_item[j].company_id == company_id){
                            return shares[i].chart_item[j].share + "%";
                        }
                    }
                    */
                });
            }
    }
    }else{
        for(i=startChartNo; i<nCharts; i++){
            var volume = shares[i].total_volume;
            var volume_aspect = shares[i].total_aspect;
            var volume_unit = shares[i].total_volume_unit;
            var chart_no = shares[i].chart_no;
            var c_label = d3.select(".chart" + chart_no).select(".c_label");
            var c_label2 = d3.select(".chart" + chart_no).select(".c_label2");
            volume = (langKey=="Japan") ? volume : formatT1(volume);
            c_label.text(function(d){
                return volume == "null" ? "" : volume ;
            });
            c_label2.text(function(d){
                return volume_aspect == "null" ? "" : volume_aspect + "[" + volume_unit + "]";   
            });
        }
    }
   
}
function filterByChart(){
    //可視化フラグのついた企業が属するチャートの可視化フラグをON
    for(var i=startChartNo; i<nCharts; i++){
        for(var j=0; j<nRanks; j++){
            for(var k=0; k<nCompanies; k++){
                if(companies_highlight[k]){
                    if(shares[i].chart_item[j].company_id == companies[k].id){                      
                        //フラグON
                        charts_highlight[i] = true;
                        break;
                    }
                }
            }
        }
    }
    
}

function setHighLight(){
    var i;
    if(isHighLighted){
        //元に戻す
        
        //円弧の可視化フラグ
        var arc_all = d3.selectAll(".arc");
        arc_all.classed('un-highlight', false);
        arc_all.classed('highlight', false);
        //ボタンの可視化フラグ
        var button_all = d3.select("#filters_company").selectAll("a");
        button_all.classed('highlight', false);
        if(isFilterGroup)
            button_all.classed('linked', false);   
        //タイトルの可視化フラグ
        var title_all = d3.selectAll(".title");
        title_all.classed('un-highlight', false);
        title_all.classed('highlight', false);
        //ラベルの可視化フラグ
        var label_bg_all = d3.selectAll(".label_bg");
        label_bg_all.classed('un-highlight', false);
        label_bg_all.classed('highlight', false);
        var label_all = d3.selectAll(".label");
        label_all.classed('un-highlight', false);
        label_all.classed('highlight', false);
        //中心ラベルの可視化フラグ
        var c_label_all = d3.selectAll(".c_label");
        c_label_all.classed('un-highlight', false);
        c_label_all.classed('highlight', false);
        if(isFilterGroup)
            c_label_all.classed('linked', false);   
        var c_label2_all = d3.selectAll(".c_label2");
        c_label2_all.classed('un-highlight', false);
        c_label2_all.classed('highlight', false);
        
        //全フラグリセット
        setFlag();
        
    }else{
        //可視化へ
        
        //非強調
        d3.selectAll(".arc").classed('un-highlight', true);
        d3.selectAll(".title").classed('un-highlight', true);
        d3.selectAll(".label").classed('un-highlight', true);
        d3.selectAll(".label_bg").classed('un-highlight', true);
        d3.selectAll(".c_label").classed('un-highlight', true);
        d3.selectAll(".c_label2").classed('un-highlight', true);

        //強調
        for(i=0; i<nCompanies; i++){
            if(companies_highlight[i]){
                var company_id = companies[i].id;
                //円弧の可視化フラグ
                var arc_selected = d3.selectAll(".arc." + company_id);
                arc_selected.classed('un-highlight', false);
                arc_selected.classed('highlight', true);
                //ボタンの可視化フラグ
                var button_selected = d3.select("#filters_company").selectAll("a." + company_id);
                button_selected.classed('highlight', true);
                if(isFilterGroup)
                    button_selected.classed('linked', true);
                
                //ラベルの可視化フラグ
                var label_bg_selected = d3.selectAll(".label_bg." + company_id);
                label_bg_selected.classed('un-highlight', false);
                label_bg_selected.classed('highlight', true);
                var label_selected = d3.selectAll(".label." + company_id);
                label_selected.classed('un-highlight', false);
                label_selected.classed('highlight', true);
            }
        }
        for(i=startChartNo; i<nCharts; i++){
            if(charts_highlight[i]){
                var chart_no = shares[i].chart_no;
                //タイトルの可視化フラグ
                var title_selected = d3.select(".chart" + chart_no).selectAll(".title");
                title_selected.classed('un-highlight', false);
                title_selected.classed('highlight', true);
                //中心ラベルの可視化フラグ
                var c_label_selected = d3.select(".chart" + chart_no).selectAll(".c_label");
                c_label_selected.classed('un-highlight', false);
                c_label_selected.classed('highlight', true);
                if(isFilterGroup)
                    c_label_selected.classed('linked', true);
                
                var c_label2_selected = d3.select(".chart" + chart_no).selectAll(".c_label2");
                c_label2_selected.classed('un-highlight', false);
                c_label2_selected.classed('highlight', true);
            }
        }
        
        //フラグON
        isHighLighted = true;
    }
}
