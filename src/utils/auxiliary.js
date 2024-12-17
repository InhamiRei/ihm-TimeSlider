/**
 * 辅助函数：解析时间字符串（格式为 "HH:mm"）为自凌晨 00:00 开始的分钟数
 * @function
 * @param {string} timeStr - 时间字符串，例如 "02:30"
 * @returns {number} 转换后的分钟数
 * @description
 * - 该函数将时间字符串（例如 "02:30"）转换为自午夜 00:00 开始的分钟数。
 * - 例如，"02:30" 会转换为 150（即 2 小时 30 分钟）。
 * @example
 * parseTimeToMinutes("02:30"); // 返回 150
 */
export const parseTimeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * 辅助函数：将分钟数转换回时间字符串（格式 "HH:mm"）
 * @function
 * @param {number} minutes - 自凌晨 00:00 开始的分钟数
 * @returns {string} 转换后的时间字符串，格式为 "HH:mm"
 * @description
 * - 该函数将分钟数转换为标准的 "HH:mm" 格式时间字符串。
 * - 例如，150 分钟会转换为 "02:30"。
 * @example
 * formatMinutesToTime(150); // 返回 "02:30"
 */
export const formatMinutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

/**
 * 辅助函数：根据分钟数计算对应的像素宽度
 * @function
 * @param {number} startMinutes - 时间块的起始分钟数
 * @param {number} endMinutes - 时间块的结束分钟数
 * @param {number} scaleWidth - 每个时间单位对应的像素宽度（px）
 * @param {number} scaleInterval - 每个时间单位对应的时间间隔（分钟）
 * @returns {number} 时间块的像素宽度
 * @description
 * - 该函数根据时间块的开始和结束分钟数，计算出该时间块对应的像素宽度。
 * - 例如，假设每小时宽度为 50px，且时间块持续 2 小时，则该时间块宽度为 100px。
 * @example
 * calculateWidth(0, 120, 50, 60); // 返回 100
 */
export const calculateWidth = (startMinutes, endMinutes, scaleWidth, scaleInterval) => {
  return ((endMinutes - startMinutes) / scaleInterval) * scaleWidth;
};

/**
 * 辅助函数：根据滑块位置计算对应的时间
 * @function
 * @param {number} blockLeft - 点击位置距离滑块容器左侧的像素值 (px)
 * @param {number} scaleWidth - 每个时间单位对应的像素宽度 (px)，例如 50px 表示 1 小时间隔为 50px
 * @param {number} scaleInterval - 每个时间单位对应的时间间隔 (分钟)，例如 30 表示每单位代表 30 分钟
 * @returns {string} 格式化的时间字符串，格式为 "HH:MM"，例如 "02:30"
 * @description
 * - 该函数通过滑块位置计算出总时间，并将其格式化为小时和分钟的形式。
 * - 总分钟数由位置 (blockLeft) 与单位宽度 (scaleWidth) 和时间间隔 (scaleInterval) 计算得出。
 * - 返回结果始终以 "HH:MM" 格式显示。
 * @example
 * calculateTimeFromPosition(150, 50, 60); // 返回 "03:00"
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

/**
 * 辅助函数：根据时间计算滑块位置
 * @function
 * @param {string} time - 时间字符串，格式为 "HH:MM"，例如 "02:30"
 * @param {number} scaleWidth - 每个时间单位对应的像素宽度 (px)，例如 50px 表示 1 小时间隔为 50px
 * @param {number} scaleInterval - 每个时间单位对应的时间间隔 (分钟)，例如 30 表示每单位代表 30 分钟
 * @returns {number} 滑块位置距离容器左侧的像素值 (px)
 * @description
 * - 该函数通过时间字符串解析总分钟数，并计算对应的滑块位置。
 * - 总分钟数由时间字符串解析为小时和分钟并求和得出。
 * - 返回值为滑块距离容器左侧的像素值。
 * @example
 * calculatePositionFromTime("03:00", 50, 60); // 返回 150
 */
export const calculatePositionFromTime = (time, scaleWidth, scaleInterval) => {
  // 将时间字符串 (hh:mm) 转换为总分钟数
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes;

  // 计算 blockLeft
  const blockLeft = (totalMinutes * scaleWidth) / scaleInterval;

  return blockLeft;
};
