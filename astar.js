// F(G+H)
// G(移动开销)  H(估算距离)
var openList = [],
  closeList = [],
  startPoint = {X: 0, Y: 0, G: 0, father: undefined},
  endPoint = [{X: 5, Y: 5}], //起点和终点
  blockList = [], // 障碍物
  gH = 10, gV = 10, gHV = 14, // 水平、垂直、对角线方向的移动权重
  mapW = 10, mapH = 10; // 地图尺寸
//pos = {X=0, Y=0, G=0, H=0, F=0, Father=pos},
// 测试用例
//blockList.push({X:1,Y:1});
//blockList.push({X:2,Y:2});

// Array 添加一个 remove 方法以便移除元素
Array.prototype.remove = function (from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

// 判断一个点是否合法
// 是否超出地图:
function isInMap(pos) {
  //console.log(pos); // TEST
  return !(pos.X < 0 || pos.Y < 0 || pos.X >= mapW || pos.Y >= mapH);
}

// 是否在 openList 和 closeList 内
function isNotInOpenList(pos) {
  if (!openList.length)
    return true;
  for (var i = 0; i < openList.length; i++) {
    if (openList[i].X === pos.X && openList[i].Y === pos.Y)
      return false
  }
  return true;
}

function isNotInCloseList(pos) {
  for (var i = 0; i < closeList.length; i++) {
    if (closeList[i].X === pos.X && closeList[i].Y === pos.Y) {
      return false;
    }
  }
  return true;
}

// 是否被阻挡
function isNotBlocked(pos) {
  if (!blockList.length)
    return true;
  for (var i = 0; i < blockList.length; i++) {
    if (blockList[i].X === pos.X && blockList[i].Y === pos.Y)
      return false;
  }
  return true;
}

// 总合法性检测
function isLegal(pos) {
  return (isInMap(pos) && isNotInCloseList(pos) && isNotBlocked(pos) && isNotInOpenList(pos));
}

function sortArr(posArr) { //给点列按 F 由大到小排序
  if (posArr.length <= 1)
    return posArr; // 直接返回不需要排序的点列
  for (var i = 1; i < posArr.length; i++) { //数量不多，冒泡足矣
    for (var j = 0; j < i; j++) {
      if (posArr[i].F > posArr[j].F) {
        var temp = posArr[i];
        posArr[i] = posArr[j];
        posArr[j] = temp;
      }
    }
  }
  return posArr;
}

// 获取周围格的情况
function lookAround(pos) {
  var res = [];
  res.push({X: (pos.X), Y: (pos.Y + 1), G: gV + pos.G});   // N
  res.push({X: (pos.X + 1), Y: (pos.Y + 1), G: gHV + pos.G}); // NE
  res.push({X: (pos.X + 1), Y: (pos.Y), G: gH + pos.G});    // E
  res.push({X: (pos.X + 1), Y: (pos.Y - 1), G: gHV + pos.G}); // SE
  res.push({X: (pos.X), Y: (pos.Y - 1), G: gV + pos.G});  // S
  res.push({X: (pos.X - 1), Y: (pos.Y - 1), G: gHV + pos.G}); // SW
  res.push({X: (pos.X - 1), Y: (pos.Y), G: gH + pos.G});    // W
  res.push({X: (pos.X - 1), Y: (pos.Y + 1), G: gHV + pos.G}); // NW
  //console.log("res: ");
  //console.dir(res); // TEST
  var removeList = [];
  for (var i = 0; i < 8; i++) { // 对点作处理
    if (!isLegal(res[i])) {
      //console.log("Remove: " + res[i].X + res[i].Y); // TEST
      removeList.push(i); // 标记不合法的部分
    }
  }
  for (i = 0; i < removeList.length; i++) {
    res.remove(removeList[i] - i); // 剔除不合法的部分
  }
  for (i = 0; i < res.length; i++) {
    res[i].H = (Math.abs(res[i].X - endPoint.X) + Math.abs(res[i].Y - endPoint.Y)) * 10; // H 参数的 Manhattan 算法
    res[i].F = res[i].G + res[i].H;
    res[i].father = pos; // 指定父点
    for (var j = 0; j < openList.length; j++) {
      if (res[i].X === openList[j].X && res[i].Y === openList[j].Y && res[i].G < openList[j].G) { // 检查点是否已在 openList 内且 G 小于原点
        openList[j] = res[i]; // 改写此点的信息
        res.remove(i); // 从结果中删除此点
        break; // 停止查找
      }
    }
  }
  return sortArr(res); // 返回按 F 排序后的sortArr
}

function nextPos(pos) {
  var surround = lookAround(pos); // 看周围格
  var next; // 下一步
  if (surround.length === 1) { // 周围只有一格可用
    next = surround[0]; // 直接走
  }
  else if (surround.length === 0) { //如果周围无可用格
    if (openList.length) { // 如果openList 里有剩余
      next = openList[openList.length - 1]; // 则在 openList 里挑一个最小 F
      openList.remove(openList.length - 1); // 从openList 中移除此格
    }
    else {
      return 0; // 返回错误
    }
  }
  else { // 周围有多于一个可用格
    next = surround[surround.length - 1]; // 走最小 F
    surround.remove(surround.length - 1); // 剔除下一步要走的格子
    openList = openList.concat(surround); // 将剩余格子加入 openList 中
  }
  closeList.push(next); // 将下一步格子压入 closeList 中
  return next;
}


function doAStar(sP, eP, bL) {
  startPoint = sP;
  endPoint = eP;
  blockList = bL; // init
  endPoint.forEach(function (ep) {
    openList = [];
    closeList = [];
    var currentPos = startPoint; // 站到起点上
    closeList.push(currentPos); // 将起点压入 closeList
    while (1) { // 开始寻路
      //openList.concat(lookAround(currentPos)); // 将周围的可用格加入openList
      // drawCanvas(); // 画图
      currentPos = nextPos(currentPos); // 走入下一格
      if (!currentPos) { // 如果无可用openList
        console.error("openList 耗尽，无可用路径。");
        break;
      }
      //console.log("Next step: " + currentPos.X + " , " + currentPos.Y); // TEST
      if ((currentPos.X === ep.X) && (currentPos.Y === ep.Y)) {
        console.info("寻路成功");
        break; // 到达终点，结束寻路。
      }
      var finalPath = [];
      while (currentPos && currentPos.father) { //开始回溯
        finalPath.push({X: currentPos.X, Y: currentPos.Y});
        currentPos = currentPos.father;
      }
      finalPath.reverse(); // 反转，得到最终结果
      canvasDrawResult(finalPath, openList, closeList); // 绘制结果
    }
  });
}
