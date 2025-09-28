/**
 * 辅助函数：解析时间字符串（格式为 "HH:mm:ss"）为自凌晨 00:00:00 开始的秒数
 * @function
 * @param {string} timeStr - 时间字符串，例如 "02:30:30"
 * @returns {number} 转换后的秒数
 * @description
 * - 该函数将时间字符串（例如 "02:30:30"）转换为自午夜 00:00 开始的秒数。
 * - 例如，"02:30:30" 会转换为 9030（即 2 小时 30 分钟 30 秒）。
 * @example
 * parseTimeToSeconds("02:30:30"); // 返回 9030
 */
export const parseTimeToSeconds = (timeStr) => {
  const [hours, minutes, seconds] = timeStr.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * 辅助函数：将秒数转换回时间字符串（格式 "HH:mm:ss"）
 * @function
 * @param {number} seconds - 自凌晨 00:00 开始的秒数
 * @returns {string} 转换后的时间字符串，格式为 "HH:mm:ss"
 * @description
 * - 该函数将秒数转换为标准的 "HH:mm:ss" 格式时间字符串。
 * - 例如，9030 秒会转换为 "02:30:30"。
 * @example
 * formatSecondsToTime(9030); // 返回 "02:30:30"
 */
export const formatSecondsToTime = (seconds) => {
  const hours = Math.floor(seconds / 3600); // 计算小时数
  const minutes = Math.floor((seconds % 3600) / 60); // 计算剩余的分钟数
  const remainingSeconds = seconds % 60; // 计算剩余的秒数

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

/**
 * 辅助函数：根据秒数计算对应的像素宽度
 * @function
 * @param {number} startSeconds - 时间块的起始秒数
 * @param {number} endSeconds - 时间块的结束秒数
 * @param {number} scaleWidth - 每个时间单位对应的像素宽度（px）
 * @param {number} scaleSeconds - 每个时间单位对应的时间间隔（秒）
 * @returns {number} 时间块的像素宽度
 * @description
 * - 该函数根据时间块的开始和结束秒数，计算出该时间块对应的像素宽度。
 * - 例如，假设每小时宽度为 50px，且时间块持续 2 小时，则该时间块宽度为 100px。
 * @example
 * calculateWidthInSeconds(0, 7200, 50, 3600); // 返回 100
 */
export const calculateWidthInSeconds = (startSeconds, endSeconds, scaleWidth, scaleSeconds) => {
  return ((endSeconds - startSeconds) / scaleSeconds) * scaleWidth;
};

/**
 * 辅助函数：根据滑块位置计算对应的时间
 * @function
 * @param {number} blockLeft - 点击位置距离滑块容器左侧的像素值 (px)
 * @param {number} scaleWidth - 每个时间单位对应的像素宽度 (px)，例如 50px 表示 1 小时间隔为 50px
 * @param {number} scaleSeconds - 每个时间单位对应的时间间隔 (秒)，例如 3600 表示每单位代表 1 小时（3600 秒）
 * @returns {string} 格式化的时间字符串，格式为 "HH:mm:ss"，例如 "02:30:00"
 * @description
 * - 该函数通过滑块位置计算出总时间，并将其格式化为小时、分钟、秒的形式。
 * - 总秒数由位置 (blockLeft) 与单位宽度 (scaleWidth) 和时间间隔 (scaleSeconds) 计算得出。
 * - 返回结果始终以 "HH:mm:ss" 格式显示。
 * @example
 * calculateTimeFromPosition(150, 50, 3600); // 返回 "01:30:00"
 */
export const calculateTimeFromPosition = (blockLeft, scaleWidth, scaleSeconds) => {
  // 计算总秒数
  const totalSeconds = (blockLeft / scaleWidth) * scaleSeconds;

  // 转换为小时、分钟和秒
  const hours = Math.floor(totalSeconds / 3600); // 计算小时数
  const minutes = Math.floor((totalSeconds % 3600) / 60); // 计算剩余分钟数
  const seconds = Math.floor(totalSeconds % 60); // 计算剩余秒数

  // 返回格式化时间
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

/**
 * 辅助函数：根据时间计算滑块位置
 * @function
 * @param {string} time - 时间字符串，格式为 "HH:MM:SS"，例如 "02:30:30"
 * @param {number} scaleWidth - 每个时间单位对应的像素宽度 (px)，例如 50px 表示 1 小时间隔为 50px
 * @param {number} scaleSeconds - 每个时间单位对应的时间间隔 (秒)，例如 3600 表示每单位代表 1 小时（3600 秒）
 * @returns {number} 滑块位置距离容器左侧的像素值 (px)
 * @description
 * - 该函数通过时间字符串解析总秒数，并计算对应的滑块位置。
 * - 总秒数由时间字符串解析为小时、分钟、秒并求和得出。
 * - 返回值为滑块距离容器左侧的像素值。
 * @example
 * calculatePositionFromTime("02:30:30", 50, 3600); // 返回 150
 */
export const calculatePositionFromTime = (time, scaleWidth, scaleSeconds) => {
  // 输入验证
  if (!time || typeof time !== "string") {
    console.warn("calculatePositionFromTime: Invalid time parameter:", time);
    return 0;
  }

  if (!scaleWidth || !scaleSeconds || scaleWidth <= 0 || scaleSeconds <= 0) {
    console.warn("calculatePositionFromTime: Invalid scaleWidth or scaleSeconds:", scaleWidth, scaleSeconds);
    return 0;
  }

  try {
    // 将时间字符串 (hh:mm:ss) 转换为总秒数
    const [hours, minutes, seconds] = time.split(":").map(Number);

    // 验证解析结果
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      console.warn("calculatePositionFromTime: Invalid time format:", time);
      return 0;
    }

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    // 检查时间是否在合理范围内 (0-86400秒，即一天)
    if (totalSeconds < 0 || totalSeconds > 86400) {
      console.warn("calculatePositionFromTime: Time out of range (0-24h):", time, totalSeconds);
      return Math.max(0, Math.min((totalSeconds * scaleWidth) / scaleSeconds, 24 * scaleWidth));
    }

    // 计算滑块位置 (blockLeft)
    const blockLeft = (totalSeconds * scaleWidth) / scaleSeconds;

    return Math.max(0, blockLeft); // 确保不返回负值
  } catch (error) {
    console.error("calculatePositionFromTime error:", error, "time:", time);
    return 0;
  }
};
