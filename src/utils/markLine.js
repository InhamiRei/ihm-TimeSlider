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
  // 清除已有的定时器，防止重复启动
  if (markerLine.movementInterval) {
    clearInterval(markerLine.movementInterval);
    markerLine.movementInterval = null;
  }

  // 计算每秒钟应移动的像素
  const pixelsPerSecond = scaleWidth / scaleSeconds; // 每秒钟移动的像素

  const executeMovement = () => {
    // 如果有暂停就不执行
    const isPaused = markerLine.isPaused;
    if (isPaused) return;

    const currentLeft = parseFloat(markerLine.style.left) || 0;
    const newLeft = currentLeft + pixelsPerSecond; // 每秒移动对应的像素

    if (newLeft >= critical) {
      // 到达临界点，停止移动
      clearInterval(markerLine.movementInterval);
      markerLine.movementInterval = null;
      markerLine.style.left = `${critical}px`;

      const time = calculateTimeFromPosition(critical, scaleWidth, scaleSeconds);
      markerLine.info = {
        time,
        criticalTime,
      };
    } else {
      markerLine.style.left = `${newLeft}px`;
      const time = calculateTimeFromPosition(newLeft, scaleWidth, scaleSeconds);
      markerLine.info = {
        time,
        criticalTime,
      };
    }
  };
  // 立即执行一次
  executeMovement();
  // 每秒执行一次
  markerLine.movementInterval = setInterval(executeMovement, 1000);
};

/**
 * 停止刻度线移动
 * @param {HTMLElement} tracksContainer - 轨道容器
 * @param {number} trackIndex - 轨道索引，不传则停止所有轨道
 */
export const stopMarkLine = (tracksContainer, trackIndex) => {
  if (!tracksContainer || !tracksContainer.children) return;

  // 如果没有指定索引，则停止所有轨道的刻度线
  if (trackIndex === undefined) {
    for (let i = 0; i < tracksContainer.children.length; i++) {
      const track = tracksContainer.children[i];
      if (track.markerLine) {
        track.markerLine.isPaused = true;
      }
    }
    return;
  }

  // 获取指定索引的轨道
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
