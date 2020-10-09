var width = 1000,
    height = 1000,
    radius = Math.min(width, height) *0.2;

var x = d3.scale.linear()
    .range([0, 2 * Math.PI]);

var y = d3.scale.linear()
    .range([radius*.0, radius]);

var color = d3.scale.category10();

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")");

var partition = d3.layout.partition()
    .value(function(d) { return d.FY2021; });

var arc = d3.svg.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
    .innerRadius(function(d) { return Math.max(0, y(d.y)); })
    .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

var color_idx = 0;

function getColor(d){
  if(d.depth == 0){
    return "#ffffff";
  }
  if(d.depth == 1){
    return color(d.name);
  }
  if(d.depth > 1){
    start_c = color(d.parent.name);
    end_c = "#FFFFFF";
    var colors = [start_c, end_c];
    var interpolated = d3.scale.linear()
      .range(colors)
      .domain([d.parent.x, d.parent.x + d.parent.dx * 1.5])
      .interpolate(d3.interpolateHsl);
    //color_idx += 2;
    return interpolated(d.x+d.dx);
  }
}

d3.json("./data/DigitalBudget2021.json", function(error, data) {

  data = pre_data(data);
  var g = svg.selectAll("g")
      .data(partition.nodes(data))
    .enter().append("g");

  var path = g.append("path")
    .attr("d", arc)
    //.attr("opacity", function(d){ return d.children ? 1 : d.change/3;})
    //.style("fill", function(d) { return color((d.children ? d : d.parent).name); })
    .style("fill", function(d) { return getColor(d); })
    
//    .style("fill", function(d){return d.children ? color(d.name) : interpolated(d.change); })
    .on("click", click);

  var text = g.append("text")
    .attr("transform", function(d) { return "rotate(" + computeTextRotation(d) + ")"; })
    /*
    .attr("x", function(d) { return y(d.y); })
    .attr("dx", "6") // margin
    .attr("dy", ".35em") // vertical-align
    */
   .attr("startOffset", "50%")
   .attr("dx", d =>{
     const rotation = computeTextRotation(d);
     return (rotation > 90 && rotation < 270) ? -6 : 6;
    })
    .attr("dy", ".35em") // vertical-align
    .attr("text-anchor", d => {
      const rotation = computeTextRotation(d);
      if(d.depth==0) return "middle";
      return (rotation > 90 && rotation < 270) ? "end" : "start";
      }
    )
    .attr("transform", d=> {
      var rotation = computeTextRotation(d);
      var translation = y(d.y);
      if (rotation > 90 && rotation < 270) {
          rotation = rotation + 180;
          translation = -translation;
      }
      if(d.depth==0) rotation=0;
      return (
          "rotate(" + rotation + ")" 
          +"translate(" + translation + ",0)"
      );
    })
    .style("stroke-width","3")
    .style("stroke", "#fff") //縁取り
    .style("fill","#000") //文字色
    .style("paint-order","stroke")
    .text(function(d) {
      var str = [d3.format("1f")(d.children ? d.value : d.FY2021) + "億円", d.name];
      var rotation = computeTextRotation(d);
      if (rotation > 90 && rotation < 270) { 
        var tmp = str[0];
        str[0] = str[1];
        str[1] = tmp;
      }
      return d.children ? 
        d.name : 
        str[0] + "　" + str[1]
      });

  function click(d) {
    // fade out all text elements
    text.transition().attr("opacity", 0);

    path.transition()
      .duration(750)
      .attrTween("d", arcTween(d))
      .each("end", function(e, i) {
          // check if the animated element's data e lies within the visible angle span given in d
          if (e.x >= d.x && e.x < (d.x + d.dx)) {
            // get a selection of the associated text element
            var arcText = d3.select(this.parentNode).select("text");
            // fade in the text element and recalculate positions
            arcText.transition().duration(750)
              .attr("opacity", 1)
              .attr("transform", function() { return "rotate(" + computeTextRotation(e) + ")" })
              .attr("x", function(d) { return y(d.y); });
          }
      });
  }
});

d3.select(self.frameElement).style("height", height + "px");

// Interpolate the scales!
function arcTween(d) {
  var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
      yd = d3.interpolate(y.domain(), [d.y, 1]),
      yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
  return function(d, i) {
    return i
        ? function(t) { return arc(d); }
        : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
  };
}

function computeTextRotation(d) {
  return (x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
}

function pre_data(arr){
    ministries = [];
    items = [];
    tmp = ""
    idx=0;
    out = [];
    for(i=0;i<arr.length;i++){
        if(tmp != arr[i].ministry){
            tmp = arr[i].ministry;
            ministries.push(tmp);
        }
    }
    for(i=0; i<arr.length;i++){
        if(ministries[idx] == arr[i].ministry){
            items.push({"name":arr[i].name, "FY2021":arr[i].FY2021, "FY2020":arr[i].FY2020, "change":arr[i].change});
        }else{
            out.push({"name":ministries[idx], "children": items});
            items = [];
            items.push({"name":arr[i].name, "FY2021":arr[i].FY2021, "FY2020":arr[i].FY2020, "change":arr[i].change});
            idx += 1;
        }
    }

    return {"name":"デジタル関連予算2021", "children": out};
}