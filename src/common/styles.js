import { _styles } from './variable.js';
import { customStyle } from '../utils/common.js';

// 左侧信息的样式(窗口x和下载按钮的父容器)
export const __styles_leftInfoContainer = (flag, styles = {}, theme) => ({
  width: '160px',
  minWidth: '160px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 10px',
  borderRight: `1px solid ${_styles[theme].borderColor}`,
});
