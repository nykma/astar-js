var rectGroup = [],     // 方格矩阵
    editStatus = 0,     // 编辑状态。0:障碍 1:起点 2:终点
    canvas = new fabric.Canvas('canvas'),    // 画布
    map = ({W:20, H:20, last:0}), // 网格数量
    canvasSize = {W:600, H:600},     // 画布尺寸
    startPoint = {X: 0, Y: 0, G: 0, father: undefined},
    endPoint = [{X: 5, Y: 5}], //起点和终点
    endDirection = "", // 起始时获取目标的大方向
    gH = 10, gV = 10, gHV = 14, // 水平、垂直、对角线方向的移动权重
    hMethod = "euclidean", // 启发式算法
    MANHATTAN = 15, // 曼哈顿算法权重
    blockList = []; // 障碍物

canvas.setHeight(canvasSize.H);
canvas.setWidth(canvasSize.W);

// Array 添加一个 remove 方法以便移除元素
Array.prototype.remove = function (from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
// 添加一个 hasPosition 方法便于查找是否有该坐标存在，并返回数组中的位置
Array.prototype.hasPosition = function (x, y) {
  for(var i=0;i<this.length;i++) {
    if(this[i].X === x && this[i].Y === y)
      return i;
  }
  return -1; // 若没有则返回-1
};

// 画网格
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
};

// 画矩形格矩阵
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
// 清除画布
var canvasClean = function () {
  blockList = [];
  canvasRefresh();
};

//刷新画布
var canvasRefresh = function () {
  map.H = document.getElementById("mapsize").value;
  map.W = document.getElementById("mapsize").value; // 获取地图长和宽
  if(map.last !== map.H) { // 如果与上次刷新相比尺寸有改变
    canvas.clear(); // 清空画布
    rectGroup = []; // 清空rectGroup
    blockList = []; // 清空blockList
    canvasDrawGrid(); // 重画网格
    canvasDrawRect(); // 重分配方格
    map.last = map.H; // 置上次尺寸位
  } else { // 否则仅将方格颜色复原
    rectGroup.forEach(function (rectLine) {
      rectLine.forEach(function (r) {
        r.set({fill: 'rgba(0,0,0,0.1)'});
      })
    })
  }
  rectGroup[startPoint.X][startPoint.Y].set({fill: "rgba(0,100,0,0.9)"}); // 起点
  endPoint.forEach(function (ep) {
    rectGroup[ep.X][ep.Y].set({fill: "orange"}); // 终点
  });
  blockList.forEach(function (b) {
    rectGroup[b.X][b.Y].set({fill: "black"}); // 障碍
  });
  canvas.renderAll();
  openList = [];
  closeList = []; // 清空 openList 和 closeList
};
// 画结果
var canvasDrawResult = function (finalPath) {
  openList.forEach(function (pos) {
    rectGroup[pos.X][pos.Y].set({fill: "rgba(84,255,159,0.7)"});
  });
  closeList.forEach(function (pos) {
    rectGroup[pos.X][pos.Y].set({fill: "rgba(82,139,139,0.7)"});
  });
  if(finalPath){
    finalPath.forEach(function (pos) {
      rectGroup[pos.X][pos.Y].set({fill: "red"});
    });
  }
  rectGroup[startPoint.X][startPoint.Y].set({fill: "rgba(0,100,0,0.9)"}); // 起点
  rectGroup[endPoint[0].X][endPoint[0].Y].set({fill: "orange"}); // 终点
  canvas.renderAll();
};
var setStartPoint = function () {  editStatus = 1; };
var setEndPoint = function () {  editStatus = 2; };

var rectClicked = function (options) {
  var toggleStatus = function (i, j) {
    var targetList = undefined, color="", removeStatus = 1;
    switch (editStatus) { // 判断当前编辑状态
      case 0:
        targetList = blockList;
        color = "rgba(0,0,0,0.9)";
        break;
      case 1:
        rectGroup[startPoint.X][startPoint.Y].set({fill: "rgba(0,0,0,0.1)"});
        startPoint.X = i;
        startPoint.Y = j;
        rectGroup[startPoint.X][startPoint.Y].set({fill: "rgba(0,100,0,0.9)"});
        canvas.renderAll(); // 更改起始点
        editStatus = 0;
        return; // 因起始点只有一个，于是直接返回
      case 2:
        targetList = endPoint;
        color = "orange";
        break;
    }
    if (targetList.length === 0){ // 若目标表为空
      targetList.push({X: i, Y: j});  // 直接将元素压入
      rectGroup[i][j].set({fill: color});// 点亮当前格
    } else {
      for (var k = 0; k < targetList.length; k++) {
        if (targetList[k].X === i && targetList[k].Y === j) { // 若表中有当前格
          rectGroup[i][j].set({fill: "rgba(0,0,0,0.1)"}); // 恢复默认颜色
          targetList.remove(k); // 从表中移除此格
          removeStatus = 0;
          break;
        }
      }
      if (removeStatus) { // 如果没做删除操作
        rectGroup[i][j].set({fill: color}); // 点亮该格；
        targetList.push({X: i, Y: j}); // 将点压入目标列
      }
    }
    canvas.renderAll(); // 刷新画布
    editStatus = 0; // 重置为障碍编辑
  };
  var rectX = Math.floor((options.e.offsetX / canvasSize.W) * map.W); // 获取鼠标点击时的格坐标
  var rectY = Math.floor((options.e.offsetY / canvasSize.H) * map.H);
  toggleStatus(rectX, rectY);
};

canvas.on("mouse:down", rectClicked); //给画布绑定点击事件

window.onload = function () {
  console.info("Loaded.");
  canvasRefresh();
};

