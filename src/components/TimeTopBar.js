import { _styles } from '../common/variable.js';
import { createElement, createScale, customStyle } from '../utils/common.js';
import { plusSVG, prevDaySVG, nextDaySVG, minusSVG } from '../common/svg.js';
import { bindDragEvents } from '../utils/eventBind.js';
import { createTimeIndicatorText } from './TimeMarker.js';

/**
 * 创建顶部栏组件
 * @param {Object} config - 配置对象
 * @returns {Object} - 包含顶部栏元素和相关信息的对象
 */
export function createTopBar(config) {
  const {
    flag,
    theme,
    styles,
    date,
    timelineWidth,
    scaleTime,
    scaleSeconds,
    onPrevDayClick,
    onNextDayClick,
    onZoomInClick,
    onZoomOutClick,
    onDateClick,
  } = config;

  const topbarContainer = createElement('div', `${flag}-ihm-timeSlider-topbarContainer`, {
    position: 'relative',
    height: customStyle(styles.headerHeight, '30px'),
    border: `1px solid ${_styles[theme].borderColor}`,
    borderBottom: 'none',
    display: 'flex',
  });

  // 左侧的时间和4个按钮
  const timeAndButtonContainer = createElement(
    'div',
    `${flag}-ihm-timeSlider-topbarContainer-info`,
    {
      position: 'relative',
      width: '160px',
      minWidth: '160px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      borderRight: `1px solid ${_styles[theme].borderColor}`,
    }
  );

  timeAndButtonContainer.innerHTML = `
    ${plusSVG(flag, styles, theme)}
    ${prevDaySVG(flag, styles, theme)}
    <span class="${flag}-ihm-timeSlider-date" style="font-size: 14px; color: ${
      _styles[theme].leftTextColor
    }; cursor: initial;pointer-events: none;">${date.toISOString().split('T')[0]}</span>
    ${nextDaySVG(flag, styles, theme)}
    ${minusSVG(flag, styles, theme)}
  `;
  topbarContainer.appendChild(timeAndButtonContainer);

  // 绑定日期点击事件
  const dateSpan = timeAndButtonContainer.querySelector(`.${flag}-ihm-timeSlider-date`);
  if (dateSpan) {
    dateSpan.addEventListener('click', onDateClick);
  }

  // 绑定按钮事件
  const plusButton = timeAndButtonContainer.querySelector(`.ihm-timeSlider-plus-svg`);
  if (plusButton) {
    plusButton.addEventListener('click', onZoomInClick);
  }

  const prevButton = timeAndButtonContainer.querySelector(`.ihm-timeSlider-prev-svg`);
  if (prevButton) {
    prevButton.addEventListener('click', onPrevDayClick);
  }

  const nextButton = timeAndButtonContainer.querySelector(`.ihm-timeSlider-next-svg`);
  if (nextButton) {
    nextButton.addEventListener('click', onNextDayClick);
  }

  const minusButton = timeAndButtonContainer.querySelector(`.ihm-timeSlider-minus-svg`);
  if (minusButton) {
    minusButton.addEventListener('click', onZoomOutClick);
  }

  // 外部容器
  const dragContainer = createElement(
    'div',
    `${flag}-ihm-timeSlider-topbarContainer-dragContainer`,
    {
      position: 'relative',
      overflow: 'hidden', // 隐藏超出的内容
      flexGrow: 1,
      height: '100%',
    }
  );

  const timelineContainer = createElement(
    'div',
    `${flag}-ihm-timeSlider-topbarContainer-scaleAxis`,
    {
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      height: '100%',
      left: '0',
      top: '0',
    }
  );

  // 创建刻度
  const scaleArr = createScale(scaleTime, scaleSeconds);
  let scaleWidth = 50; // 默认刻度宽度

  for (let i = 0; i <= scaleTime; i++) {
    let x = (1 / scaleTime) * (timelineWidth - 160);
    if (x > 50) {
      scaleWidth = x;
    } else {
      x = scaleWidth;
    }

    const scaleBlock = createElement(
      'div',
      `${flag}-ihm-timeSlider-topbarContainer-scaleAxis-axisBlock`,
      {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        // 如果是最后一个宽度为1
        width: i === scaleTime ? '1px' : `${x}px`,
        height: '100%',
        backgroundColor: _styles[theme].headerBackgroundColor,
        color: _styles[theme].headerTextColor,
        fontSize: customStyle(styles.headerFontSize, '11px'),
      }
    );

    // 根据条件设置 margin-left
    const marginLeft =
      i === 0
        ? customStyle(styles.headerFirstTextMargin, '0px')
        : i === scaleTime
          ? customStyle(styles.headerLastTextMargin, '-30px')
          : customStyle(styles.headerNormalTextMargin, '-15px');

    scaleBlock.innerHTML = `
      <span class="${flag}-ihm-timeSlider-topbarContainer-scaleAxis-axisBlock-span" style="user-select: none; margin-left: ${marginLeft};">${scaleArr[
        i
      ].slice(0, 5)}</span>
      <div class="${flag}-ihm-timeSlider-topbarContainer-scaleAxis-axisBlock-axis" style="width: ${customStyle(
        styles.headerFontSize,
        '1px'
      )}; height: ${customStyle(styles.headerFontSize, '4px')}; background-color: ${
        _styles[theme].headerAxisColor
      }; position: absolute; left: 0; bottom: 0;"></div>
    `;

    timelineContainer.appendChild(scaleBlock);
  }

  dragContainer.appendChild(timelineContainer);
  topbarContainer.appendChild(dragContainer);

  // 创建时间指示文本
  const timeIndicatorText = createTimeIndicatorText(flag, theme);
  timelineContainer.appendChild(timeIndicatorText);

  // 绑定拖拽事件
  bindDragEvents(
    dragContainer,
    timelineContainer,
    `${flag}-ihm-timeSlider-trackContainer-trackRow-slider`
  );

  return {
    topbarContainer,
    dragContainer,
    timelineContainer,
    timeIndicatorText,
    scaleWidth,
  };
}
