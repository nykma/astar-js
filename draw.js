var rectGroup = [],     // 方格矩阵
    editStatus = 0,     // 编辑状态。0:障碍 1:起点 2:终点
    canvas = new fabric.Canvas('canvas'),    // 画布
    map = ({W:6, H:6}), // 网格数量
    canvasSize = {W:600, H:600},     // 画布尺寸
    startPoint = {X: 0, Y: 0, G: 0, father: undefined},
    endPoint = [{X: 5, Y: 5}], //起点和终点
    gH = 10, gV = 10, gHV = 14, // 水平、垂直、对角线方向的移动权重
    blockList = []; // 障碍物

canvas.setHeight(canvasSize.H);
canvas.setWidth(canvasSize.W);

// Array 添加一个 remove 方法以便移除元素
Array.prototype.remove = function (from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

var canvasDrawGrid = function () {
  var lineGroup = [];
  var lineSpaceW = canvasSize.W / map.W;
  var lineSpaceH = canvasSize.H / map.H;
  for (var i = 1; i < map.W; i++) {
    var lineW = new fabric.Line([-(canvasSize.W / 2), lineSpaceW * i, canvasSize.W / 2, lineSpaceW * i], {
      stroke: 'orange',
      strokeWidth: 1,
      selectable: false
    });
    lineGroup.push(lineW);
  }
  for (i = 1; i < map.H; i++) {
    var lineH = new fabric.Line([lineSpaceH * i, canvasSize.H / 2, lineSpaceH * i, -(canvasSize.H / 2)], {
      stroke: 'orange',
      strokeWidth: 2,
      selectable: false
    });
    lineGroup.push(lineH);
  }
  lineGroup.forEach(function (line) {
    canvas.add(line);
  });

  console.info("Into drawGrid.");
};

var canvasDrawRect = function () {
  var W = canvasSize.W / map.W;
  var H = canvasSize.H / map.H;
  for (var i = 0; i < map.W; i++) {
    var rectLine = []; // 一列方格
    for (var j = 0; j < map.H; j++) {
      var r = new fabric.Rect({
        left: i * W + 5,
        top: j * H + 5,
        width: W - 6,
        height: H - 6,
        fill: 'rgba(0,0,0,0.1)',
        selectable: false
      });
      rectLine.push(r);
      canvas.add(r);
    }
    rectGroup.push(rectLine);
  }
};

var canvasRefresh = function () {
  rectGroup.forEach(function (rectLine) {
    rectLine.forEach(function (r) {
      r.set({fill: 'rgba(0,0,0,0.1)'}); // 全部格初始化颜色
    })
  });
  rectGroup[startPoint.X][startPoint.Y].set({fill: "rgba(0,100,0,0.9)"}); // 起点
  endPoint.forEach(function (ep) {
    rectGroup[ep.X][ep.Y].set({fill: "orange"}); // 终点
  });
  canvas.renderAll();
};

var canvasDrawResult = function (finalPath) {
  console.log(finalPath);
  finalPath.forEach(function (pos) {
    rectGroup[pos.X][pos.Y].set({fill: "red"});
  });
  openList.forEach(function (pos) {
    rectGroup[pos.X][pos.Y].set({fill: "purple"});
  });
  closeList.forEach(function (pos) {
    rectGroup[pos.X][pos.Y].set({fill: "green"});
  });
  canvas.renderAll();
};
var setStartPoint = function () {  editStatus = 1; };
var setEndPoint = function () {  editStatus = 2; };

var rectClicked = function (options) {
  var toggleStatus = function () {
    var status = 0;
    var targetList = undefined;
    switch (editStatus) { // 判断当前编辑状态
      case 0:
        targetList = blockList;
        break;
      case 1:
        rectGroup[startPoint.X][startPoint.Y].set({fill: "rgba(0,0,0,0.1)"});
        startPoint = {X: i, Y: j};
        rectGroup[startPoint.X][startPoint.Y].set({fill: "rgba(0,100,0,0.9)"});
        canvas.renderAll(); // 更改起始点
        break;
      case 2:
        targetList = endPoint;
        break;
    }
    if (targetList && targetList.length === 0)
      targetList.push({X: i, Y: j});
    for (var k = 0; k < targetList.length; k++) {
      if (targetList[k].X === i && targetList[k].Y === j) {
        targetList.remove(k);
        status = 1;
        break;
      }
    }
    if (!status) {
      targetList.push({X: i, Y: j});
    }
  };
  //console.log(options);
  //console.log(options.e.offsetX);
  //console.log(options.e.offsetY);
  var rectX = Math.floor((options.e.offsetX / canvasSize.W) * map.W);
  var rectY = Math.floor((options.e.offsetY / canvasSize.H) * map.H);
  console.log(rectX, rectY);
  //return toggleStatus;
  //canvasRefresh();
};

canvas.on("mouse:down", rectClicked); //给格子分配点击事件
window.onload = function () {
  console.info("Loaded.");
  canvasDrawGrid();
  canvasDrawRect();
  canvasRefresh();
};

