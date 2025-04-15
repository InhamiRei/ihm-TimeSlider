import { calculateTimeFromPosition, calculatePositionFromTime } from "./auxiliary.js";
import { generateTimeObj } from "./common.js";

/**
 * 启动刻度线移动
 * @param {HTMLElement} markerLine - 刻度线元素
 * @param {number} critical - 临界位置
 * @param {number} criticalTime - 临界时间
 * @param {number} scaleWidth - 刻度宽度
 * @param {number} scaleSeconds - 刻度秒间隔
 */
export const startMarkerMovement = (markerLine, critical, criticalTime, scaleWidth, scaleSeconds) => {
  // 清除已有的动画帧，防止重复启动
  if (markerLine.animationFrameId) {
    cancelAnimationFrame(markerLine.animationFrameId);
    markerLine.animationFrameId = null;
  }

  // 计算每秒钟应移动的像素
  const pixelsPerSecond = scaleWidth / scaleSeconds; // 每秒钟移动的像素

  // 记录上一次执行的时间
  let lastTime = null;
  const accumulatedTime = { value: 0 };

  const animate = (timestamp) => {
    // 如果有暂停就不执行
    if (markerLine.isPaused) {
      lastTime = timestamp;
      markerLine.animationFrameId = requestAnimationFrame(animate);
      return;
    }

    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // 累积时间，确保动画不会因为帧率波动而不准确
    accumulatedTime.value += deltaTime;

    // 每秒更新一次位置
    if (accumulatedTime.value > 1000) {
      const currentLeft = parseFloat(markerLine.style.left) || 0;
      const newLeft = currentLeft + pixelsPerSecond;

      if (newLeft >= critical) {
        // 到达临界点，停止移动
        markerLine.style.left = `${critical}px`;
        const time = calculateTimeFromPosition(critical, scaleWidth, scaleSeconds);
        markerLine.info = { time, criticalTime };
        return; // 不再继续请求动画帧
      } else {
        markerLine.style.left = `${newLeft}px`;
        const time = calculateTimeFromPosition(newLeft, scaleWidth, scaleSeconds);
        markerLine.info = { time, criticalTime };
      }

      // 重置累积时间，确保每秒只移动一次
      accumulatedTime.value = accumulatedTime.value % 1000;
    }

    // 请求下一帧
    markerLine.animationFrameId = requestAnimationFrame(animate);
  };

  // 开始动画
  markerLine.animationFrameId = requestAnimationFrame(animate);
};

/**
 * 停止刻度线移动
 * @param {HTMLElement} tracksContainer - 轨道容器
 * @param {number} trackIndex - 轨道索引，不传则停止所有轨道
 */
export const stopMarkLine = (tracksContainer, trackIndex) => {
  if (!tracksContainer || !tracksContainer.children) return;

  if (trackIndex === undefined) {
    for (let i = 0; i < tracksContainer.children.length; i++) {
      const track = tracksContainer.children[i];
      if (track.markerLine) {
        track.markerLine.isPaused = true;
        // 如果需要完全停止而不是暂停，还可以取消动画帧
        // if (track.markerLine.animationFrameId) {
        //   cancelAnimationFrame(track.markerLine.animationFrameId);
        //   track.markerLine.animationFrameId = null;
        // }
      }
    }
    return;
  }

  const track = tracksContainer.children[trackIndex];
  if (track && track.markerLine) {
    track.markerLine.isPaused = true;
  }
};

/**
 * 恢复刻度线移动
 * @param {HTMLElement} tracksContainer - 轨道容器
 * @param {number} trackIndex - 轨道索引，不传则恢复所有轨道
 */
export const resumeMarkLine = (tracksContainer, trackIndex) => {
  if (!tracksContainer || !tracksContainer.children) return;

  // 如果没有指定索引，则启动所有轨道的刻度线
  if (trackIndex === undefined) {
    for (let i = 0; i < tracksContainer.children.length; i++) {
      const track = tracksContainer.children[i];
      if (track.markerLine) {
        track.markerLine.isPaused = false;
      }
    }
    return;
  }

  // 获取指定索引的轨道
  const track = tracksContainer.children[trackIndex];
  if (track && track.markerLine) {
    track.markerLine.isPaused = false;
  }
};
