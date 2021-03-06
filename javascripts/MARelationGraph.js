//Reference
//http://www.d3noob.org/2013/03/d3js-force-directed-graph-example-basic.html
//http://bl.ocks.org/mfolnovic/6269308/5c017c0391a8e12db1fc573be3ef8a9bdcb5a117
//http://bl.ocks.org/ericcoopey/6c602d7cb14b25c179a4

////////////////
//Global Var. //
////////////////

//var localPrefix = "http://localhost/";
var localPrefix = "";

//初期化(グローバル変数)
var SRC_URL1 = localPrefix + "data/CompanyData.json";
var SRC_URL2 = localPrefix + "data/RelationData.json";
var langKey;
var companies;      //企業データ
var graphData;      //データ配列
var graph;          //唯一のグラフオブジェクト
var R_def = 15;     //ノード半径
var R_Zoom = 30;    //ノード半径（ズーム時）
var L = 300;        //リンク距離
var w = 960, h = 700;
var color = d3.scale.category10();
var flgCurveLine = true;   //リンク線のスタイル
var didFirstClick = false;  //ダブルクリック用の初回クリック判定

//Set Language
function setLangKey(_langKey){
    langKey = _langKey;        
}

//キャンバスの用意
var vis = d3.select("#charts")
    .attr("width", w)
    .attr("height", h)
    .attr("id", "svg")
    .attr("pointer-events", "all")
    .attr("viewBox", "0 0 " + w + " " + h)
    .attr("perserveAspectRatio", "xMinYMid")
//矢印の用意
    vis.append("svg:defs")
        .selectAll("marker")
        .data(["Arrow", "Disconnect"])
        .enter()
        .append("svg:marker")
        .attr("id", function(d) { return d; })
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -1.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");

var force = d3.layout.force();
var nodes = force.nodes(),
    links = force.links();

//力学的レイアウトの設定
force.gravity(0.3)    //重力：画面重心への引力(default:0.1)
    .friction(0.5)  //最適化係数：0なら瞬時に止まる
    .size([w, h])
    .distance(100)
    .linkDistance(L);    //リンク長

//Loading data
queue()
.defer(d3.json, SRC_URL1)
.defer(d3.json, SRC_URL2)
.await(ready);

function ready(error, companyData, relationData) {
    ///////////////////
    // Initial func. //
    ///////////////////
    if (error) throw error;
    
    companies = companyData;
    graphData = relationData;
    
    drawGraph();

    function myGraph(){

        //ノード追加
        this.addNode = function(id){
            nodes.push({"id":id});  //配列nodesへ1つ要素追加
            update();   //反映
        };
        //リンク追加
        this.addLink = function( source, target, arrow, topic, description, value) {
            //配列linksへ要素1つ追加
            links.push(
                {
                "source": findNode(source), 
                "target": findNode(target), 
                "arrow": arrow, 
                "topic": topic, 
                "description": description, 
                "value": value 
                }
            );
            update();   //反映
        };

        //ノード削除
        this.removeNode = function(id){
            var i = 0;
            var n = findNode(id);   //ノードエレメント取得
            while(i<links.length){
                if((links[i]['source'] == n) || (links[i]['target'] == n)){
                    links.splice(i, 1); //リンク削除(配列linksのi番目の1個要素を削除)
                }
                else i++;
            }
            nodes.splice(findNodeIndex(id), 1); //ノード削除(配列nodesのindex番目の1個要素を削除)
            update();   //反映
        };
        //リンク削除
        this.removeLink = function( source, target) {
            for (var i=0; i< links.length; i++){
                if(links[i].source.id == source && links[i].target.id == target) {
                    links.splice(i, 1); //リンク削除(配列linksのi番目の1個要素を削除)
                    break;
                }
            }
            update();   //反映
        };
        //全リンク削除
        this.removeAllLinks = function() {
            links.splice(0, links.length); //リンク削除(配列linksの0番目以降の全要素を削除)
            update();   //反映
        };
        //全ノード削除
        this.removeAllNodes = function(){
            nodes.splice(0, nodes.length); //ノード削除(配列nodessの0番目以降の全要素を削除)
        };
        //ノード探索
        var findNode = function(id) {
            for (var i in nodes) {
                if(nodes[i]["id"] === id) return nodes[i];
            }
        };
        //ノードインデックス探索
        var findNodeIndex = function (id) {
            for (var i =0; i< nodes.length; i++){
                if(nodes[i].id == id){
                    return i;
                }
            }
        };


        //★処理開始点★
        update();

    }

    //更新処理
    function update(){
        //リンク作成
        var link = vis.selectAll(".link")
            .data(links, function(d) {
                return d.source.id + "-" + d.target.id; //データバインディング
            });
        //リンクの属性値
        link.enter().append("svg:path")
            .attr("id", function(d){
                return d.source.id + "_" + d.target.id;
            })
            .attr("stroke-width", function (d) {
                return d.value / 10;    //線の太さ
            })
            .attr("class", function(d) {
                return "link " + d.arrow;
            })
            .attr("marker-mid", function(d) {
                return "url(#" + d.arrow + ")";
            });
        //リンク削除処理
        link.exit()
            .remove();


        //リンクラベル作成
        var linkLabel = vis.selectAll(".linkLabel")
            .data(links, function(d) {
                return d.source.id + "-" + d.target.id; //データバインディング
            });
        //リンクラベルの属性値
        linkLabel.enter().append("svg:text")
                .attr("id", function(d){ return d.source.id + "_" + d.target.id;})
                .attr("class", "linkLabel")
                .attr("dy", "-0.5em")
                .append("svg:textPath")
                .attr("startOffset", "50%")
                .attr("text-anchor", "middle")
                .attr("xlink:href", function(d) { return "#" + d.source.id + "_" + d.target.id; })
                .text(function(d) { return d.description; });
        //リンクラベル削除処理
        linkLabel.exit().remove();

        //ノード作成
        var node = vis.selectAll("g.node")
            .data(nodes, function(d) { //データバインディング
                    return d.id;
            });
        //ノードグループ作成
        var nodeEnter = node.enter()
                        .append("g")
                        .attr("class", "node")
                        .on("mouseover", mouseover)
                        .on("mouseout", mouseout)
                        .on("mousedown", mousedown)
                        .attr("id", function(d){ return d.id; })
                        .call(force.drag);      //ドラッグイベント紐づけ
        //ノードグループの属性
        nodeEnter.append("svg:circle")
                .attr("r", R_def)           //ノード半径設定
                /*
                .attr("id", function(d){
                    return d.id;  //id設定
                })
                */
                .attr("class", "nodeCircle")
                .attr("fill", function(d) {
                    return color(d.id);     //色設定
                });
        //ノードグループのラベル
        nodeEnter.append("svg:text")    //グロー用
                .attr("class", "label_bg")
                //.attr("x", 12)
                .attr("y", ".31em")
                //.attr("dx", "1em")
                //.attr("dy", ".31em")
                .attr("text-anchor", "middle")
                .text(function(d){
                    return companyName(d.id);
                });
        nodeEnter.append("svg:text")
                .attr("class", "label")
                //.attr("x", 12)
                .attr("y", ".31em")
                //.attr("dx", "1em")
                //.attr("dy", ".31em")
                .attr("text-anchor", "middle")
                .text(function(d){
                    return companyName(d.id);
                });
        //ノードグループの終端処理
        node.exit()
            .remove();

        //ノード・エッジの配置
        force.on("tick", function(){
            link.attr("d", function(d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx*dx+dy*dy);
                if(flgCurveLine){
                  return "M" + 
                    d.source.x + "," + 
                    d.source.y + "A" + 
                    dr + "," + dr + " 0 0,1 " + 
                    d.target.x + "," + 
                    d.target.y;
                }else{
                    return "M" +    
                    d.source.x + "," + 
                    d.source.y + " L" + 
                    d.target.x + "," + 
                    d.target.y;
                }
              });
          node.attr("transform", function(d) {
              return "translate(" + d.x + "," + d.y + ")";
          });
        })
        .charge(function(d){    //引力：負の値は斥力（接続ノード数に応じて斥力強く）
            return d.weight != 0 ? -d.weight*2000 : -1000; 
        });
        //力学的レイアウトの再始動
        force.start();

    }



    function mouseover() {
      var selectedNode = d3.select(this)
            .classed("highlight", true)

      selectedNode.select("circle")  
          .transition()
            .duration(100)
            .attr("r", R_Zoom);

        var i=0;
        var select_nodeId = selectedNode/*.select(".nodeCircle")*/.attr("id")
        while(i<links.length){
            if((links[i].source.id == select_nodeId) || (links[i].target.id == select_nodeId)){
                var linked_nodeId = (links[i].source.id == select_nodeId) ? links[i].target.id : links[i].source.id;
                //ID指定でリンクをハイライト
                vis.selectAll("#" + links[i].source.id + "_" + links[i].target.id)
                    .classed("highlight", true);
                vis.selectAll("#" + linked_nodeId)
                    .classed("mid-highlight", true);
            }
            i++;
        }  

    }

    function mouseout() {
      var selectedNode = d3.select(this)
          .classed("highlight", false)
      selectedNode.select("circle")
          .transition()
          .duration(100)
          .attr("r", R_def);

        var i=0;
        var select_nodeId = selectedNode/*.select(".nodeCircle")*/.attr("id")
        while(i<links.length){
            if((links[i].source.id == select_nodeId) || (links[i].target.id == select_nodeId)){
                var linked_nodeId = (links[i].source.id == select_nodeId) ? links[i].target.id : links[i].source.id;
                //ID指定
                vis.selectAll("#" + links[i].source.id + "_" + links[i].target.id)
                    .classed("highlight", false);
                vis.selectAll("#" + linked_nodeId)
                    .classed("mid-highlight", false);
            }
            i++;
        }    
    }

    function mousedown() {
        if(!didFirstClick){
            // 1回目のクリック判定を真にする
    		didFirstClick = true ;
    
    		// 350ミリ秒だけ、1回目のクリック判定を残す
    		setTimeout( function() {
    			didFirstClick = false ;
    		}, 350 ) ;
    	
    	//ダブルクリック判定
        }else{
            var selectedNode = d3.select(this)
            var select_nodeId = selectedNode/*.select(".nodeCircle")*/.attr("id");
    
            if(selectedNode.attr("class") == "node select highlight"){
                selectedNode.classed("select", false);
                var i=0;
                while(i<links.length){
                    if((links[i].source.id == select_nodeId) ||  (links[i].target.id == select_nodeId)){
                        var linked_nodeId = (links[i].source.id == select_nodeId) ? links[i].target.id : links[i].source.id;
                        //ID指定
                        vis.selectAll("#" + select_nodeId + "_" + linked_nodeId)
                            .classed("highlight", false);
                        vis.selectAll("#" + linked_nodeId)
                            .classed("mid-highlight", false);
                    }
                    i++;
                }
                removeLinksBySelect(select_nodeId);
            }else{
                selectedNode.classed("select", true);
                addLinksBySelect(select_nodeId);
            }        
            
    		// 1回目のクリック判定を解除
    		didFirstClick = false ;            
        }
    }

    function addLinksBySelect(nodeId){
        var linksArr = graphData.links;
        for(var i=0; i<linksArr.length; i++){
            if(linksArr[i].source == nodeId ||
               linksArr[i].target == nodeId){
                graph.addLink(
                    linksArr[i].source, 
                    linksArr[i].target, 
                    linksArr[i].arrow, 
                    linksArr[i].topic, 
                    (langKey=="Japan") ? linksArr[i].description_jp : linksArr[i].description_us, 
                    '50');
                keepNodesOnTop();
            }
        }
    }

    function removeLinksBySelect(nodeId){
        var linksArr = graphData.links;
        for(var i=0; i<linksArr.length; i++){
            if(linksArr[i].source == nodeId ||
               linksArr[i].target == nodeId){
                graph.removeLink(
                    linksArr[i].source, 
                    linksArr[i].target);
            }
        }
    }
    
    function demoSenario(){
            //初期シナリオ
            graph.addNode('Sophia');
            graph.addNode('Daniel');
            graph.addNode('Ryan');
            graph.addNode('Lila');
            graph.addNode('Suzie');
            graph.addNode('Riley');
            graph.addNode('Grace');
            graph.addNode('Dylan');
            graph.addNode('Mason');
            graph.addNode('Emma');
            graph.addNode('Alex');
            graph.addLink('Alex', 'Ryan', 'Arrow', 'Compuer', 'Alex-Ryan', '20');
            graph.addLink('Sophia', 'Ryan', 'Arrow', 'Compuer', 'Sophia-Ryan', '20');
            graph.addLink('Daniel', 'Ryan', 'Arrow', 'Compuer', 'Daniel-Ryan', '20');
            graph.addLink('Ryan', 'Lila', 'Arrow', 'Compuer', 'Ryan-Lila', '20');
            graph.addLink('Lila', 'Suzie', 'Arrow', 'Compuer', 'Lila-Suzie', '20');
            graph.addLink('Suzie', 'Riley', 'Arrow', 'Compuer', 'Suzie-Riley', '20');
            graph.addLink('Suzie', 'Grace', 'Arrow', 'Compuer', 'Suzie-Grace', '20');
            graph.addLink('Grace', 'Dylan', 'Arrow', 'Compuer', 'Grace-Dylan', '20');
            graph.addLink('Dylan', 'Mason', 'Arrow', 'Compuer', 'Dylan-Mason', '20');
            graph.addLink('Dylan', 'Emma', 'Arrow', 'Compuer', 'Dylan-Emma', '20');
            graph.addLink('Emma', 'Mason', 'Arrow', 'Compuer', 'Emma-Mason', '20');

            keepNodesOnTop();

            // アニメーションシナリオ
            var step = -1;
            function nextval()
            {
                step++;
                return 2000 + (1500*step); // initial time, wait time
            }

            setTimeout(function() {
                graph.addLink('Alex', 'Sophia', 'Arrow', 'Compuer', 'NEW:Alex-Sophia', '50');
                keepNodesOnTop();
            }, nextval());

            setTimeout(function() {
                graph.addLink('Sophia', 'Daniel', 'Arrow', 'Compuer', 'NEW:Sophia-Daniel', '50');
                keepNodesOnTop();
            }, nextval());

            setTimeout(function() {
                graph.addLink('Daniel', 'Alex', 'Arrow', 'Compuer', 'NEW:Daniel-Alex', '50');
                keepNodesOnTop();
            }, nextval());

            setTimeout(function() {
                graph.addLink('Suzie', 'Daniel', 'Arrow', 'Compuer', 'NEW:Suzie-Daniel', '50');
                keepNodesOnTop();
            }, nextval());

            setTimeout(function() {
                graph.removeLink('Dylan', 'Mason');
                graph.addLink('Dylan', 'Mason', 'Arrow', 'Compuer', 'NEW:Dylan-Mason', '50');
                keepNodesOnTop();
            }, nextval());

            setTimeout(function() {
                graph.removeLink('Dylan', 'Emma');
                graph.addLink('Dylan', 'Emma', 'Arrow', 'Compuer', 'NEW:Dylan-Emma', '50');
                keepNodesOnTop();
            }, nextval());    
    }

    //データ制御
    function drawGraph(){
            graph = new myGraph();

            //demoSenario();

            var nodesArr = graphData.nodes;    
            for(var i=0; i<nodesArr.length; i++){
                graph.addNode(nodesArr[i].id);
            }
    }


    //企業名変換
    function companyName(id){
        var retValue = "";
        for(var i=0; i<companies.length; i++){
            if(companies[i].id == id){
                retValue = (langKey=="Japan") ? companies[i].name_jp :  companies[i].id;
            }
        }
        return retValue;
    }

};

//////////////////
// Filter Func. //
//////////////////

function removeLinksByTopic(topicId){
    var linksArr = graphData.links;    
    for(var i=0; i<linksArr.length; i++){
        if(topicId == "All" || topicId == "RESET"){
            graph.removeAllLinks();
        }else if(linksArr[i].topic == topicId){
            graph.removeLink(
                linksArr[i].source, 
                linksArr[i].target);
        }
    }
}

function addLinksByTopic(topicId){
    var linksArr = graphData.links;    
    for(var i=0; i<linksArr.length; i++){
        if(topicId == "All"){
            graph.addLink(
                linksArr[i].source, 
                linksArr[i].target, 
                linksArr[i].arrow, 
                linksArr[i].topic, 
                (langKey=="Japan") ? linksArr[i].description_jp : linksArr[i].description_us, 
                '50');
            keepNodesOnTop();
        }else if(linksArr[i].topic == topicId){
            graph.addLink(
                linksArr[i].source, 
                linksArr[i].target, 
                linksArr[i].arrow, 
                linksArr[i].topic, 
                (langKey=="Japan") ? linksArr[i].description_jp : linksArr[i].description_us, 
                '50');
            keepNodesOnTop();
        }
    }
}

//ノードを最前面へ
//ノード追加後にリンクを追加する仕様なので、
// 常にノードの前面にリンクが来てしまうため
function keepNodesOnTop() {
    $(".nodeCircle").each(function( index ) {
        var gnode = this.parentNode;
        gnode.parentNode.appendChild(gnode);
    });
}
