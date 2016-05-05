//Global var.
var SRC_URL1 = "data/Comments.json";
var ANIMATION_TIME = 5000;
var width = 1280;
var height = 720;
var maxScale = 5.0; //スケール
var maxRad = 90;   //回転角

//Load data
queue()
.defer(d3.json, SRC_URL1)
.await(ready);

function ready(error, words) {
    var canvas = d3.select("div#canvas").append("svg")
        .attr("width", width)
        .attr("height", height);
    
    //抽出
    var cArr = [];
    var idx = 0;
    for(var i=0; i< words.length; i++){
        if(words[i].flag == "True"){
            cArr[idx] = words[i];
            cArr[idx].sortNo = idx;
            idx++;
        }
    }
    
    //定義
    var comments = canvas.selectAll("text")
            .data(cArr)
            .enter().append("text")
            .attr("class", "comment")
            .attr("id", function(d){return "c" + d.sortNo;})
            .attr("opacity", 0)   //非表示
            .style("text-anchor", "middle")
            .text(function(d){
                return d.comment;
            });

    /*
    //散らす
    comments
        .attr("transform", function(d){
            var x = Math.floor( Math.random() * (width - 200) ) + 100;
            var y = Math.floor( Math.random() * (height - 200) ) + 100;
            var s = Math.floor( Math.random() * maxScale ) + 1.0;
            var r = Math.floor( Math.random() * maxRad );
            return "translate(" + [x,y] + ")scale(" + s + ")rotate(" + r + ")";
        });
    */
    
    //タイミング
    var sel_sortNo;
    for(var i=0; i<cArr.length; i++){

        var x = Math.floor( Math.random() * (width - 200) ) + 100;
        var y = Math.floor( Math.random() * (height - 200) ) + 100;
        var s = Math.floor( Math.random() * maxScale ) + 1.0;
        var r = Math.floor( Math.random() * maxRad ) - maxRad/2;
        
        /*
        //アニメーション1
        d3.select("#c" + i)
            .attr("opacity", 1)
            .attr("transform", "translate(" + [x,-height] + ")scale(" + s + ")rotate(" + r + ")")
            .transition()
            .delay((ANIMATION_TIME/10) * i)
            .duration(ANIMATION_TIME)
            .ease("bounce")
            .attr("transform", "translate(" + [x,y] + ")scale(" + s + ")rotate(" + r + ")");
        */
        //アニメーション2
        d3.select("#c" + i)
            .attr("transform", "translate(" + [x,y] + ")scale(" + s + ")rotate(" + r + ")")
            .transition()
            .delay((ANIMATION_TIME/10) * i)
            .duration(ANIMATION_TIME)
            .attr("opacity", 1);
    }
};
