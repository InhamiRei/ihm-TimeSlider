import { parseTimeToSeconds, formatSecondsToTime, calculateWidthInSeconds } from "./auxiliary.js";
import { _version } from "../common/variable.js";

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
 * customStyle(42, 10); // 返回 42
 *
 * // 示例 2：`value` 为 `null`，返回 `defaultValue`
 * customStyle(null, 10); // 返回 10
 *
 * // 示例 3：`value` 为 `undefined`，返回 `defaultValue`
 * customStyle(undefined, 10); // 返回 10
 */
export const customStyle = (value, defaultValue) => {
  return value !== null && value !== undefined ? value : defaultValue;
};

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
 * @param {Array} recordings - 时间范围数组，每个元素包含 startTime 和 endTime
 * @param {number} scaleWidth - 每个时间单位对应的像素宽度 (px)，例如 50px 表示 1 小时间隔为 50px
 * @param {number} scaleSeconds - 每个时间单位对应的时间间隔 (秒)，例如 3600 表示每单位代表 1 小时（3600 秒）
 * @returns {Array} 时间块数组，包含 start, end, width, color 等信息
 * @description
 * - 该函数根据传入的时间范围数组 `recordings`，以及每个时间单位的像素宽度 `scaleWidth` 和时间间隔 `scaleSeconds`，
 *   计算出对应的时间块，并将它们格式化为 `HH:mm:ss` 格式。
 * - 每个时间块包含起始时间、结束时间、宽度（根据像素和时间间隔计算）以及颜色（表示时间是否空闲）。
 * - 该函数支持在时间块之间自动填充空闲时间，并以灰色表示空闲时间，以蓝色表示占用时间。
 * @example
 * createTimeBlocks([{ startTime: "2024-12-17 00:00:00", endTime: "2024-12-17 02:00:00" }], 50, 3600);
 * // 返回时间块数组
 */
export const createTimeBlocks = (recordings, recordingsExtInfo, scaleWidth, scaleSeconds, theme) => {
  // 初始化时间块数组和上一个时间块的结束时间，默认从 00:00:00 开始（秒）
  const timeBlocks = [];
  let lastEnd = parseTimeToSeconds("00:00:00");

  // 遍历传入的时间范围数组
  recordings.forEach((range) => {
    // 将时间范围的起始和结束时间转换为秒
    const startSeconds = parseTimeToSeconds(range.startTime.split(" ")[1]);
    const endSeconds = parseTimeToSeconds(range.endTime.split(" ")[1]);

    // 如果当前时间块与上一个时间块之间有间隙
    if (startSeconds > lastEnd) {
      timeBlocks.push({
        start: formatSecondsToTime(lastEnd),
        end: formatSecondsToTime(startSeconds),
        width: calculateWidthInSeconds(lastEnd, startSeconds, scaleWidth, scaleSeconds),
        color: "transparent",
        extInfo: recordingsExtInfo,
      });
    }

    // 添加当前时间范围对应的蓝色时间块
    timeBlocks.push({
      start: formatSecondsToTime(startSeconds),
      end: formatSecondsToTime(endSeconds),
      width: calculateWidthInSeconds(startSeconds, endSeconds, scaleWidth, scaleSeconds),
      color: theme === "dark-theme" ? "#626773" : "#dbdee7",
      extInfo: recordingsExtInfo,
    });

    // 更新最后的结束时间
    lastEnd = endSeconds;
  });

  // 如果最后一个时间块之后还有剩余时间，填充为无色
  const endOfDay = parseTimeToSeconds("24:00:00");
  if (lastEnd < endOfDay) {
    timeBlocks.push({
      start: formatSecondsToTime(lastEnd),
      end: formatSecondsToTime(endOfDay),
      width: calculateWidthInSeconds(lastEnd, endOfDay, scaleWidth, scaleSeconds),
      color: "transparent",
      extInfo: recordingsExtInfo,
    });
  }

  // 返回所有时间块
  return timeBlocks;
};

/**
 * 生成指定日期和时间的时间对象
 * @param {Date | string} dateInput - 起始日期，可以是 Date 对象或可被 new Date() 解析的字符串
 * @param {string} time - 时间字符串，格式为 "HH:mm"，将附加到日期后面生成完整时间
 * @returns {Object} 返回包含 day、nextDay、time、nextTime、rawTime 的对象
 * @property {string} day - 当前日期（格式：YYYY-MM-DD）
 * @property {string} nextDay - 次日日期（格式：YYYY-MM-DD）
 * @property {string} time - 当前日期与时间组合（格式：YYYY-MM-DD HH:mm）
 * @property {string} nextTime - 次日日期与时间组合（格式：YYYY-MM-DD HH:mm）
 * @property {string} rawTime - 原始传入的时间字符串（格式：HH:mm）
 * @description
 * - 该函数接收一个日期和一个时间字符串，生成一个包含当前日期、次日日期、
 *   当前完整时间、次日完整时间，以及原始时间字符串的对象。
 * - 日期格式为 `YYYY-MM-DD`，完整时间格式为 `YYYY-MM-DD HH:mm`
 * - 可用于需要处理连续两天时间的场景，比如日程安排、时间段划分等。
 * @example
 * generateTimeObj("2025-03-20T15:00:00", "15:00");
 * // 返回：
 * // {
 * //   day: "2025-03-20",
 * //   nextDay: "2025-03-21",
 * //   time: "2025-03-20 15:00",
 * //   nextTime: "2025-03-21 15:00",
 * //   rawTime: "15:00"
 * // }
 */
export const generateTimeObj = (dateInput, time) => {
  const date = new Date(dateInput);
  const day = date.toISOString().split("T")[0];

  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + 1);
  const nextDay = nextDate.toISOString().split("T")[0];

  return {
    day,
    nextDay,
    time: `${day} ${time}`,
    nextTime: `${nextDay} ${time}`,
    rawTime: time,
  };
};

/**
 * 调整日期
 * @param {Date} date - 当前日期
 * @param {string} direction - 'prev' 或 'next'
 * @returns {Date} - 调整后的日期
 */
export const adjustDate = (date, direction) => {
  const newDate = new Date(date);
  if (direction === "prev") {
    newDate.setDate(newDate.getDate() - 1);
  } else if (direction === "next") {
    newDate.setDate(newDate.getDate() + 1);
  }
  return newDate;
};

window.console.log.apply(console, [
  "\n%c  %c ARGES - 时间轴版本: v" + _version,
  `background:url('data:image/png;base64,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')
no-repeat; padding:1px 1px;background-size: 100% 100%;background-position: center;`,
  "color: #f08b1e;padding:5px 0;",
]);
