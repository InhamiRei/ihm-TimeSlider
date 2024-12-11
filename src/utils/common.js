// 创建元素
export const createElement = (tag, className, styles = {}) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  Object.assign(element.style, styles);
  return element;
};

// 获取元素
export const getContainer = (id) => {
  const container = document.getElementById(id);
  if (!container) {
    throw new Error(`Container ${id} not found`);
  }
  return container;
};

// 刻度线生成 如果传入24就返回 00:00, 01:00, 02:00,..., 24:00，25个刻度线
export const createScale = (scaleTime, scaleInterval) => {
  const totalMinutes = scaleTime * scaleInterval;

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const scale = [];
  for (let i = 0; i <= totalMinutes; i += scaleInterval) {
    scale.push(formatTime(i));
  }

  return scale;
};

// 创建时间块的函数
export const createTimeBlocks = (timeRanges, scaleWidth, scaleInterval) => {
  /**
   * 辅助函数：解析时间字符串（格式为 "HH:mm"）为自凌晨 00:00 开始的分钟数
   * @param {string} timeStr - 时间字符串，例如 "02:30"
   * @returns {number} 转换后的分钟数
   */
  function parseTimeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * 辅助函数：根据分钟数计算对应的像素宽度
   * @param {number} startMinutes - 时间块的起始分钟数
   * @param {number} endMinutes - 时间块的结束分钟数
   * @param {number} scaleWidth - 宽度
   * @returns {number} 时间块的像素宽度
   */
  function calculateWidth(startMinutes, endMinutes, scaleWidth) {
    return ((endMinutes - startMinutes) / scaleInterval) * scaleWidth;
  }

  // 初始化时间块数组和上一个时间块的结束时间，默认从 00:00 开始
  const timeBlocks = [];
  let lastEnd = parseTimeToMinutes("00:00");

  // 遍历传入的时间范围数组
  timeRanges.forEach((range) => {
    // 将时间范围的起始和结束时间转换为分钟数
    const startMinutes = parseTimeToMinutes(range.startTime.split(" ")[1]);
    const endMinutes = parseTimeToMinutes(range.endTime.split(" ")[1]);

    // 如果当前时间块与上一个时间块之间有间隙，填充灰色时间块
    if (startMinutes > lastEnd) {
      timeBlocks.push({
        start: lastEnd,
        end: startMinutes,
        width: calculateWidth(lastEnd, startMinutes, scaleWidth),
        color: "gray", // 灰色表示空闲时间
      });
    }

    // 添加当前时间范围对应的蓝色时间块
    timeBlocks.push({
      start: startMinutes,
      end: endMinutes,
      width: calculateWidth(startMinutes, endMinutes, scaleWidth),
      color: "blue", // 蓝色表示占用时间
    });

    // 更新最后的结束时间
    lastEnd = endMinutes;
  });

  // 如果最后一个时间块之后还有剩余时间，填充为灰色
  const endOfDay = parseTimeToMinutes("24:00");
  if (lastEnd < endOfDay) {
    timeBlocks.push({
      start: lastEnd,
      end: endOfDay,
      width: calculateWidth(lastEnd, endOfDay, scaleWidth),
      color: "gray", // 灰色表示空闲时间
    });
  }

  // 返回所有时间块
  return timeBlocks;
};

/**
 * 计算点击位置对应的时间
 * @param {number} blockLeft - 点击位置相对于滑块容器的左侧距离 (px)
 * @param {number} scaleWidth - 每个单位的像素值 (px)，例如 50px
 * @param {number} scaleInterval - 每个单位的时间值 (分钟)，例如 30分钟
 * @returns {string} 格式化的时间字符串，例如 "02:30"
 */
export const calculateTimeFromPosition = (blockLeft, scaleWidth, scaleInterval) => {
  // 计算总分钟数
  const totalMinutes = (blockLeft / scaleWidth) * scaleInterval;

  // 转换为小时和分钟
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);

  // 返回格式化时间
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};
