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
export const createScale = (scaleCount) => {
  const intervals = {
    24: 60, // 1小时
    48: 30, // 30分钟
    288: 5, // 5分钟
    1440: 1, // 1分钟
  };

  // 确保输入的 scaleCount 是有效值
  const interval = intervals[scaleCount];
  if (!interval) {
    throw new Error(`Invalid scaleCount. Supported values are ${Object.keys(intervals).join(", ")}.`);
  }

  const totalMinutes = scaleCount * intervals[scaleCount];

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const scale = [];
  for (let i = 0; i <= totalMinutes; i += intervals[scaleCount]) {
    scale.push(formatTime(i));
  }

  return scale;
};

export const createTimeBlocks = (timeRanges, scale) => {
  // Helper function to parse time string into minutes since 00:00
  function parseTimeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  // Helper function to calculate pixel width based on minutes
  function calculateWidth(startMinutes, endMinutes, scale) {
    return ((endMinutes - startMinutes) / 30) * scale;
  }

  // Convert time ranges to minutes since 00:00
  const timeBlocks = [];
  let lastEnd = parseTimeToMinutes("00:00");

  timeRanges.forEach((range) => {
    const startMinutes = parseTimeToMinutes(range.startTime.split(" ")[1]);
    const endMinutes = parseTimeToMinutes(range.endTime.split(" ")[1]);

    // Add gray block for gap between last end and current start
    if (startMinutes > lastEnd) {
      timeBlocks.push({
        start: lastEnd,
        end: startMinutes,
        width: calculateWidth(lastEnd, startMinutes, scale),
        color: "gray",
      });
    }

    // Add blue block for the current time range
    timeBlocks.push({
      start: startMinutes,
      end: endMinutes,
      width: calculateWidth(startMinutes, endMinutes, scale),
      color: "blue",
    });

    lastEnd = endMinutes;
  });

  // Add gray block for any remaining time until the end of the day
  const endOfDay = parseTimeToMinutes("24:00");
  if (lastEnd < endOfDay) {
    timeBlocks.push({
      start: lastEnd,
      end: endOfDay,
      width: calculateWidth(lastEnd, endOfDay, scale),
      color: "gray",
    });
  }

  return timeBlocks;
};
