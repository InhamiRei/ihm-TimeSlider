import { parseTimeToMinutes, formatMinutesToTime, calculateWidth } from "./auxiliary.js";

/**
 * 创建一个 HTML 元素并设置其类名和样式
 * @param {string} tag - 要创建的元素标签（例如 'div'、'span' 等）
 * @param {string} className - 元素的类名
 * @param {Object} styles - 一个包含 CSS 样式的对象（键值对）
 * @returns {HTMLElement} 创建的 HTML 元素
 * @description
 * - 该函数创建一个指定标签的 HTML 元素，并为其设置类名和内联样式。
 * @example
 * createElement('div', 'my-class', { backgroundColor: 'red', width: '100px' });
 * // 返回一个 <div> 元素，带有 'my-class' 类和红色背景
 */
export const createElement = (tag, className, styles = {}) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  Object.assign(element.style, styles);
  return element;
};

/**
 * 根据给定的 id 获取 DOM 元素
 * @param {string} id - 元素的 id
 * @returns {HTMLElement} 获取的 DOM 元素
 * @throws {Error} 如果未找到元素，则抛出错误
 * @description
 * - 该函数根据提供的 `id` 查找并返回 DOM 元素。
 * - 如果找不到该元素，抛出一个错误。
 * @example
 * getContainer('my-container'); // 返回 id 为 'my-container' 的 DOM 元素
 */
export const getContainer = (id) => {
  const container = document.getElementById(id);
  if (!container) {
    throw new Error(`Container ${id} not found`);
  }
  return container;
};

/**
 * 生成刻度线数组，根据给定的时间范围和时间间隔
 * @param {number} scaleTime - 时间范围（例如 24 表示 24 小时）
 * @param {number} scaleMinutes - 每个时间单位的间隔（例如 60 分钟表示每小时的间隔）
 * @returns {Array<string>} 刻度线的时间数组
 * @description
 * - 该函数生成从 `00:00` 到指定时间范围（如 24 小时）的刻度线数组，时间单位按照 `scaleMinutes` 进行分隔。
 * - 例如，`scaleTime` 为 24，`scaleMinutes` 为 60，会生成 25 个刻度线（每小时一个）。
 * @example
 * createScale(24, 60); // 返回 ["00:00", "01:00", "02:00", ..., "24:00"]
 */
export const createScale = (scaleTime, scaleMinutes) => {
  const totalMinutes = scaleTime * scaleMinutes;

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const scale = [];
  for (let i = 0; i <= totalMinutes; i += scaleMinutes) {
    scale.push(formatTime(i));
  }

  return scale;
};

/**
 * 根据时间范围创建时间块
 * @param {Array} timeRanges - 时间范围数组，每个元素包含 startTime 和 endTime
 * @param {number} scaleWidth - 每个时间单位对应的像素宽度 (px)，例如 50px 表示 1 小时间隔为 50px
 * @param {number} scaleMinutes - 每个时间单位对应的时间间隔 (分钟)，例如 30 表示每单位代表 30 分钟
 * @returns {Array} 时间块数组，包含 start, end, width, color 等信息
 * @description
 * - 该函数根据传入的时间范围数组 `timeRanges`，以及每个时间单位的像素宽度 `scaleWidth` 和时间间隔 `scaleMinutes`，
 *   计算出对应的时间块，并将它们格式化为 `HH:mm` 格式。
 * - 每个时间块包含起始时间、结束时间、宽度（根据像素和时间间隔计算）以及颜色（表示时间是否空闲）。
 * - 该函数支持在时间块之间自动填充空闲时间，并以灰色表示空闲时间，以蓝色表示占用时间。
 * @example
 * createTimeBlocks([{ startTime: "2024-12-17 00:00", endTime: "2024-12-17 02:00" }], 50, 60);
 * // 返回时间块数组
 */
export const createTimeBlocks = (timeRanges, scaleWidth, scaleMinutes) => {
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
        start: formatMinutesToTime(lastEnd),
        end: formatMinutesToTime(startMinutes),
        width: calculateWidth(lastEnd, startMinutes, scaleWidth, scaleMinutes),
        color: "gray", // 灰色表示空闲时间
      });
    }

    // 添加当前时间范围对应的蓝色时间块
    timeBlocks.push({
      start: formatMinutesToTime(startMinutes),
      end: formatMinutesToTime(endMinutes),
      width: calculateWidth(startMinutes, endMinutes, scaleWidth, scaleMinutes),
      color: "blue", // 蓝色表示占用时间
    });

    // 更新最后的结束时间
    lastEnd = endMinutes;
  });

  // 如果最后一个时间块之后还有剩余时间，填充为灰色
  const endOfDay = parseTimeToMinutes("24:00");
  if (lastEnd < endOfDay) {
    timeBlocks.push({
      start: formatMinutesToTime(lastEnd),
      end: formatMinutesToTime(endOfDay),
      width: calculateWidth(lastEnd, endOfDay, scaleWidth, scaleMinutes),
      color: "gray", // 灰色表示空闲时间
    });
  }

  // 返回所有时间块
  return timeBlocks;
};
