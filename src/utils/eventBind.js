import { calculateTimeFromPosition } from './auxiliary.js';

/**
 * 绑定拖拽事件
 * @param {HTMLElement} dragContainer - 拖拽容器
 * @param {HTMLElement} timelineContainer - 时间轴容器
 * @param {string} trackSelectorClass - 轨道选择器类名
 */
export const bindDragEvents = (dragContainer, timelineContainer, trackSelectorClass) => {
  let isDragging = false;
  let startX = 0;
  let currentLeft = 0;
  let velocity = 0;
  let lastDeltaX = 0;

  const syncSliderPositions = () => {
    // 找到页面中所有轨道元素
    const sliders = document.querySelectorAll(`.${trackSelectorClass}`);
    sliders.forEach((slider) => {
      slider.style.left = `${currentLeft}px`;
    });
  };

  const updatePosition = () => {
    if (!isDragging) return;

    const newLeft = currentLeft + velocity;
    const maxLeft = 0;
    const minLeft = dragContainer.offsetWidth - timelineContainer.offsetWidth;

    // 应用限制并更新位置
    currentLeft = Math.min(maxLeft, Math.max(minLeft, newLeft));
    timelineContainer.style.left = `${currentLeft}px`;

    // 同步更新其他元素的位置
    syncSliderPositions();

    // 减速效果
    velocity *= 0.9;
    if (Math.abs(velocity) > 0.1) {
      requestAnimationFrame(updatePosition);
    }
  };

  // 滚轮事件
  dragContainer.addEventListener(
    'wheel',
    (e) => {
      // 向上滚动：减小位置（时间轴向左移）
      // 向下滚动：增加位置（时间轴向右移）
      const scrollSpeed = e.deltaY > 0 ? 10 : -10; // 根据滚动方向设置速度
      currentLeft += scrollSpeed;

      // 限制滚动范围
      const maxLeft = 0;
      const minLeft = dragContainer.offsetWidth - timelineContainer.offsetWidth;
      currentLeft = Math.min(maxLeft, Math.max(minLeft, currentLeft));

      timelineContainer.style.left = `${currentLeft}px`;

      // 同步其他元素的滚动
      syncSliderPositions();
    },
    { passive: true }
  );

  dragContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    lastDeltaX = 0;
    dragContainer.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    velocity = deltaX - lastDeltaX; // 计算加速度
    currentLeft += deltaX;
    startX = e.clientX;
    lastDeltaX = deltaX;

    const maxLeft = 0;
    const minLeft = dragContainer.offsetWidth - timelineContainer.offsetWidth;
    currentLeft = Math.min(maxLeft, Math.max(minLeft, currentLeft));
    timelineContainer.style.left = `${currentLeft}px`;

    // 同步更新其他元素的位置
    syncSliderPositions();
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;

    isDragging = false;
    requestAnimationFrame(updatePosition); // 开始惯性滑动
    dragContainer.style.cursor = 'default';
  });
};

/**
 * 绑定鼠标悬停事件
 * @param {HTMLElement} sliderContainer - 滑块容器
 * @param {HTMLElement} timeIndicatorLine - 时间指示线
 * @param {HTMLElement} timeIndicatorText - 时间显示文本
 * @param {HTMLElement} timelineContainer - 时间轴容器
 * @param {number} scaleWidth - 刻度宽度
 * @param {number} scaleSeconds - 刻度秒间隔
 * @param {Object} styles - 自定义样式
 */
export const bindHoverEvents = (
  sliderContainer,
  timeIndicatorLine,
  timeIndicatorText,
  timelineContainer,
  scaleWidth,
  scaleSeconds,
  styles
) => {
  sliderContainer.addEventListener('mousemove', (event) => {
    const container_left = sliderContainer.getBoundingClientRect().left;
    const click_left = event.clientX;
    const line_left = click_left - container_left;

    // 根据鼠标位置计算当前时间
    const time = calculateTimeFromPosition(line_left, scaleWidth, scaleSeconds);

    // 更新时间指示线位置
    timeIndicatorLine.style.left = `${line_left}px`;

    // 更新时间显示
    updateTimeDisplay(timeIndicatorText, time, line_left, timelineContainer);
  });

  sliderContainer.addEventListener('mouseleave', () => {
    timeIndicatorLine.style.left = '-9999px'; // 隐藏时间指示线
    timeIndicatorText.style.left = '-9999px'; // 隐藏时间显示
  });
};

/**
 * 更新时间显示
 * @param {HTMLElement} timeIndicatorText - 时间显示元素
 * @param {string} time - 时间字符串
 * @param {number} line_left - 指示线左边距离
 * @param {HTMLElement} timelineContainer - 时间轴容器
 */
const updateTimeDisplay = (timeIndicatorText, time, line_left, timelineContainer) => {
  timeIndicatorText.style.left = `${line_left - 18}px`;
  timeIndicatorText.textContent = time;
};
