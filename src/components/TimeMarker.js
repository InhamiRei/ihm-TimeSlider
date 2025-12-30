import { createElement } from '../utils/common.js';
import { _styles } from '../common/variable.js';

/**
 * 创建时间标记线
 * @param {string} flag - 标识前缀
 * @param {Object} styles - 样式配置
 * @param {string} theme - 主题
 * @param {boolean} isIndicator - 是否为指示器
 * @returns {HTMLElement} 创建的标记线元素
 */
export function createTimeMarker(flag, styles, theme, isIndicator = false) {
  const className = isIndicator
    ? `${flag}-ihm-timeSlider-timeMarker`
    : `${flag}-ihm-timeSlider-markerLine`;
  const color = isIndicator ? _styles[theme].markerLineHoverColor : _styles[theme].markerLineColor;
  const width = isIndicator
    ? styles.markerLineHoverWidth || '1px'
    : styles.markerLineWidth || '1px';

  const markerLine = createElement('div', className, {
    position: 'absolute',
    top: '0',
    left: isIndicator ? '-9999px' : '0', // 指示器初始隐藏
    width: width,
    height: '100%',
    zIndex: 2025, // 确保在滑块上层
    pointerEvents: 'none', // 防止事件阻挡
    backgroundColor: color,
  });

  return markerLine;
}

/**
 * 创建时间显示文本
 * @param {string} flag - 标识前缀
 * @param {string} theme - 主题
 * @returns {HTMLElement} 创建的时间显示元素
 */
export function createTimeIndicatorText(flag, theme) {
  return createElement('div', `${flag}-ihm-timeSlider-timeDisplay`, {
    position: 'absolute',
    top: '0',
    left: '-9999px', // 初始隐藏
    color: _styles[theme].headerTimeMarkerColor,
    fontSize: '10px',
  });
}
