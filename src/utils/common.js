import { parseTimeToSeconds, formatSecondsToTime, calculateWidthInSeconds } from "./auxiliary.js";

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
 * 生成刻度线数组，根据给定的时间范围和时间间隔（秒级）
 * @param {number} scaleTime - 时间范围（例如 24 表示 24 小时）
 * @param {number} scaleSeconds - 每个时间单位的间隔（秒），例如 3600 秒表示每小时的间隔
 * @returns {Array<string>} 刻度线的时间数组，格式为 "HH:mm:ss"
 * @description
 * - 该函数生成从 `00:00:00` 到指定时间范围（如 24 小时）的刻度线数组，时间单位按照 `scaleSeconds` 进行分隔。
 * - 例如，`scaleTime` 为 24，`scaleSeconds` 为 3600，会生成 25 个刻度线（每小时一个）。
 * @example
 * createScale(24, 3600); // 返回 ["00:00:00", "01:00:00", "02:00:00", ..., "24:00:00"]
 */
export const createScale = (scaleTime, scaleSeconds) => {
  const totalSeconds = scaleTime * 3600; // 将时间范围转换为秒（例如 24 小时转换为 86400 秒）

  // 格式化秒数为 "HH:mm:ss"
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const scale = [];
  for (let i = 0; i <= totalSeconds; i += scaleSeconds) {
    scale.push(formatTime(i));
  }

  return scale;
};

/**
 * 根据时间范围创建时间块
 * @param {Array} timeRanges - 时间范围数组，每个元素包含 startTime 和 endTime
 * @param {number} scaleWidth - 每个时间单位对应的像素宽度 (px)，例如 50px 表示 1 小时间隔为 50px
 * @param {number} scaleSeconds - 每个时间单位对应的时间间隔 (秒)，例如 3600 表示每单位代表 1 小时（3600 秒）
 * @returns {Array} 时间块数组，包含 start, end, width, color 等信息
 * @description
 * - 该函数根据传入的时间范围数组 `timeRanges`，以及每个时间单位的像素宽度 `scaleWidth` 和时间间隔 `scaleSeconds`，
 *   计算出对应的时间块，并将它们格式化为 `HH:mm:ss` 格式。
 * - 每个时间块包含起始时间、结束时间、宽度（根据像素和时间间隔计算）以及颜色（表示时间是否空闲）。
 * - 该函数支持在时间块之间自动填充空闲时间，并以灰色表示空闲时间，以蓝色表示占用时间。
 * @example
 * createTimeBlocks([{ startTime: "2024-12-17 00:00:00", endTime: "2024-12-17 02:00:00" }], 50, 3600);
 * // 返回时间块数组
 */
export const createTimeBlocks = (timeRanges, scaleWidth, scaleSeconds) => {
  // 初始化时间块数组和上一个时间块的结束时间，默认从 00:00:00 开始（秒）
  const timeBlocks = [];
  let lastEnd = parseTimeToSeconds("00:00:00");

  // 遍历传入的时间范围数组
  timeRanges.forEach((range) => {
    // 将时间范围的起始和结束时间转换为秒
    const startSeconds = parseTimeToSeconds(range.startTime.split(" ")[1]);
    const endSeconds = parseTimeToSeconds(range.endTime.split(" ")[1]);

    // 如果当前时间块与上一个时间块之间有间隙，填充灰色时间块
    if (startSeconds > lastEnd) {
      timeBlocks.push({
        start: formatSecondsToTime(lastEnd),
        end: formatSecondsToTime(startSeconds),
        width: calculateWidthInSeconds(lastEnd, startSeconds, scaleWidth, scaleSeconds),
        color: "gray", // 灰色表示空闲时间
      });
    }

    // 添加当前时间范围对应的蓝色时间块
    timeBlocks.push({
      start: formatSecondsToTime(startSeconds),
      end: formatSecondsToTime(endSeconds),
      width: calculateWidthInSeconds(startSeconds, endSeconds, scaleWidth, scaleSeconds),
      color: "blue", // 蓝色表示占用时间
    });

    // 更新最后的结束时间
    lastEnd = endSeconds;
  });

  // 如果最后一个时间块之后还有剩余时间，填充为灰色
  const endOfDay = parseTimeToSeconds("24:00:00");
  if (lastEnd < endOfDay) {
    timeBlocks.push({
      start: formatSecondsToTime(lastEnd),
      end: formatSecondsToTime(endOfDay),
      width: calculateWidthInSeconds(lastEnd, endOfDay, scaleWidth, scaleSeconds),
      color: "gray", // 灰色表示空闲时间
    });
  }

  // 返回所有时间块
  return timeBlocks;
};

// 工具方法：判断是否为 DOM 节点
export const isDom = (value) => {
  return typeof HTMLElement === "object"
    ? value instanceof HTMLElement
    : value && typeof value === "object" && value.nodeType === 1 && typeof value.nodeName === "string";
};

/**
 * 返回给定值或默认值
 * @param {*} value - 需要检查的值。可以是任意类型，通常为 `null` 或 `undefined` 需要被检查。
 * @param {*} defaultValue - 如果 `value` 为 `null` 或 `undefined`，则返回此默认值。
 * @returns {*} 如果 `value` 不是 `null` 或 `undefined`，则返回 `value`；否则返回 `defaultValue`。
 * @description
 * 该方法用于判断传入的 `value` 是否为 `null` 或 `undefined`。
 * - 如果 `value` 是有效值（即非 `null` 或 `undefined`），则返回 `value`。
 * - 如果 `value` 为 `null` 或 `undefined`，则返回传入的 `defaultValue`。
 *
 * 该方法可以帮助处理一些可能为 `null` 或 `undefined` 的变量，避免在使用时出现错误。
 * 它常用于获取值时提供一个回退值。
 *
 * @example
 * // 示例 1：`value` 为有效值，返回 `value`
 * resolveValue(42, 10); // 返回 42
 *
 * // 示例 2：`value` 为 `null`，返回 `defaultValue`
 * resolveValue(null, 10); // 返回 10
 *
 * // 示例 3：`value` 为 `undefined`，返回 `defaultValue`
 * resolveValue(undefined, 10); // 返回 10
 */
export const resolveValue = (value, defaultValue) => {
  return value !== null && value !== undefined ? value : defaultValue;
};
