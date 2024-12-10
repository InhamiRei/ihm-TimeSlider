// 创建元素
export const createElement = (tag, className, styles = {}) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  Object.assign(element.style, styles);
  return element;
};
