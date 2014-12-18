// F(G+H)
// G(移动开销)  H(估算距离)

// 判断一个点是否合法
// 是否超出地图:
function isInMap(pos) {
  return !(pos.X < 0 || pos.Y < 0 || pos.X >= map.W || pos.Y >= map.H);
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
  if (!blockList.length) // 如果障碍列表为空
    return true; // 直接返回
  for (var i = 0; i < blockList.length; i++) {
    if (blockList[i].X === pos.X && blockList[i].Y === pos.Y) // 走上了障碍格
      return false;
  }
  switch (pos.direction) { // 根据移动方向判断是否「穿墙」
    case "NE": // 判断移动方向的对角线是否同时存在两块障碍
      if(blockList.hasPosition(pos.X -1,pos.Y) >=0 && blockList.hasPosition(pos.X, pos.Y+1) >=0)
        return false;
      break;
    case "NW":
      if(blockList.hasPosition(pos.X +1,pos.Y) >=0 && blockList.hasPosition(pos.X, pos.Y+1) >=0)
        return false;
      break;
    case "SE":
      if(blockList.hasPosition(pos.X -1,pos.Y) >=0 && blockList.hasPosition(pos.X, pos.Y-1) >=0)
        return false;
      break;
    case "SW":
      if(blockList.hasPosition(pos.X +1,pos.Y) >=0 && blockList.hasPosition(pos.X, pos.Y-1) >=0)
        return false;
      break;
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
  for (var i = 1; i < posArr.length; i++) { //冒泡
    for (var j = 0; j < i; j++) {
      if (posArr[i].F > posArr[j].F) {
        var temp = posArr[i];
        posArr[i] = posArr[j];
        posArr[j] = temp;
      }
    }
  }
  if((posArr[posArr.length-2].F === posArr[posArr.length-1].F) && (posArr[posArr.length-2].direction === endDirection)) {
    var t = posArr[posArr.length-2]; // 若最终两点的权重相同，则按指向终点的方向走
    posArr[posArr.length-2] = posArr[posArr.length-1];
    posArr[posArr.length-1] = t;
  }
  return posArr;
}
// 获取大方向
function getEndDirection(pos) {
  var xx = 0, yy=0; // 取符号
  if(pos.X !== endPoint[0].X)
    xx = (pos.X - endPoint[0].X) / Math.abs(pos.X - endPoint[0].X);
  if(pos.Y !== endPoint[0].Y)
    yy = (pos.Y - endPoint[0].Y) / Math.abs(pos.Y - endPoint[0].Y);
  switch (xx) {
    case 0: // 起点与终点横坐标相等
      switch (yy) {
        case 1: // 如果终点纵坐标比起点纵坐标小
          endDirection = "N"; // 终点在起点北边
          break;
        case -1:
          endDirection = "S";
          break;
      }
      break;
    case 1: // 起点横坐标比终点横坐标大，说明终点在起点西边。
      switch (yy) {
        case 0:
          endDirection = "W";
          break;
        case 1:
          endDirection = "NW";
          break;
        case -1:
          endDirection = "SW";
          break;
      }
      break;
    case -1: // 起点横坐标比终点小，终点在起点东边
      switch (yy) {
        case 0:
          endDirection = "E";
          break;
        case 1:
          endDirection = "NE";
          break;
        case -1:
          endDirection = "SE";
          break;
      }
      break;
  }

}

function heuristics(pos) {
  var dx = Math.abs(pos.X - endPoint[0].X);
  var dy = Math.abs(pos.Y - endPoint[0].Y);
  switch (hMethod) {
    case "manhattan":
      return (MANHATTAN * (dx + dy));
    case "diagonal":
      return (gH * (dx + dy) + (gHV - 2 * gH) * Math.min(dx, dy));
    case "euclidean":
      return gH * Math.sqrt(dx * dx + dy * dy);
  }
}
// 获取周围格的情况
function lookAround(pos) {
  getEndDirection(pos); // 刷新大方向
  var res = []; // 看周围八个点
  res.push({X: (pos.X), Y: (pos.Y + 1), G: gV + pos.G, direction:"S"});
  res.push({X: (pos.X + 1), Y: (pos.Y), G: gH + pos.G, direction:"E"});
  res.push({X: (pos.X), Y: (pos.Y - 1), G: gV + pos.G, direction:"N"});
  res.push({X: (pos.X - 1), Y: (pos.Y), G: gH + pos.G, direction:"W"});
  res.push({X: (pos.X + 1), Y: (pos.Y + 1), G: gHV + pos.G, direction:"SE"});
  res.push({X: (pos.X + 1), Y: (pos.Y - 1), G: gHV + pos.G, direction:"NE"});
  res.push({X: (pos.X - 1), Y: (pos.Y - 1), G: gHV + pos.G, direction:"NW"});
  res.push({X: (pos.X - 1), Y: (pos.Y + 1), G: gHV + pos.G, direction:"SW"});
  for (var i = 0; i < res.length; i++) {
    if (!isLegal(res[i])) {
      res.remove(i); // 剔除不合法的点
      i--;
    }
  }
  for (i = 0; i < res.length; i++) {
    res[i].H = heuristics(res[i]);
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
  return sortArr(res); // 返回按 F 和大方向排序后的结果
}

// 确定要走的下一格
function nextPos(pos) {
  var surround = lookAround(pos); // 看周围
  var next;
  if (surround.length === 1) { // 如果周围只有一格可用
    next = surround[0]; // 直接走
  }
  else if (surround.length === 0) { //如果周围无可用格
    if (openList.length) // 如果openList 里有剩余
      next = openList.pop(); // 则在 openList 里弹出最小 F
    else  // 如果 openList 空了
      return 0; // 返回错误
  }
  else { // 周围有多于一个可用格
    next = surround.pop(); // 走最小 F
    openList = openList.concat(surround); // 将剩余格子加入 openList 中
  }
  closeList.push(next); // 将下一步格子压入 closeList 中
  return next; // 返回下一步
}
// 寻路
function doAStar() {
  var currentPos = startPoint; // 站到起点上
  getEndDirection(currentPos);  // 获取终点相对于起点的大方向
  canvasRefresh(); // 刷新画布
  closeList.push(currentPos); // 将起点压入 closeList
  while (1) { // 开始寻路
    currentPos = nextPos(currentPos); // 走入下一格
    canvasDrawResult(); // 刷新画布结果
    if (!currentPos) { // 如果无可用 openList
      console.error("openList 耗尽，无可用路径。");
      alert("openList 耗尽，无可用路径。");
      break;
    }
    if ((currentPos.X === endPoint[0].X) && (currentPos.Y === endPoint[0].Y)) {
      console.info("寻路成功");
      break; // 到达终点，结束寻路。
    }
  }
  var finalPath = [];
  while (currentPos && currentPos.father) { //开始回溯
    finalPath.push({
      X: currentPos.X,
      Y: currentPos.Y,
      F: currentPos.F,
      G:currentPos.G,
      H: currentPos.H
    });
    currentPos = currentPos.father;
  }
  finalPath.reverse(); // 反转，得到最终结果
  // console.dir(finalPath);
  canvasDrawResult(finalPath); // 绘制结果
  if(endPoint.length>=2) { // 如果有多于一个终点
    startPoint.X = endPoint[0].X;
    startPoint.Y = endPoint[0].Y; // 将上一次终点作为下一次起点
    endPoint.remove(0); // 移除上一次终点
  }
}
