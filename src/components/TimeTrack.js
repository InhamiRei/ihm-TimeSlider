import { _styles } from "../common/variable.js";
import { createElement, generateTimeObj, customStyle } from "../utils/common.js";
import { __styles_leftInfoContainer } from "../common/styles.js";
import { downloadSVG } from "../common/svg.js";
import { createTimeMarker } from "./TimeMarker.js";
import { bindHoverEvents } from "../utils/eventBind.js";
import { startMarkerMovement } from "../utils/markLine.js";
import { calculateTimeFromPosition, calculatePositionFromTime } from "../utils/auxiliary.js";
import { createTimeBlocks } from "../utils/common.js";

/**
 * 创建单个轨道
 * @param {Object} config - 轨道配置
 * @returns {Object} - 包含轨道元素和相关信息的对象
 */
export function createTrack(config) {
  const {
    flag,
    theme,
    styles,
    trackIndex,
    recordings,
    extInfo,
    isLastTrack,
    scaleWidth,
    scaleSeconds,
    onDownloadClick,
    onSegmentDblClick,
    timeIndicatorText,
    timelineContainer,
    markerLineInfo,
    showDownloadBtn = true,
  } = config;

  // 创建轨道行
  const trackRow = createElement("div", `${flag}-ihm-timeSlider-trackContainer-trackRow`, {
    position: "relative",
    flexGrow: "1",
    height: `${config.trackHeight || 25}px`,
    border: `1px solid ${_styles[theme].borderColor}`,
    borderBottom: isLastTrack ? `1px solid ${_styles[theme].borderColor}` : "none",
    display: "flex",
    backgroundColor: _styles[theme].trackBackgroundColor,
  });

  // 创建左侧信息容器
  const infoContainer = createElement("div", `${flag}-ihm-timeSlider-trackContainer-trackRow-info`, __styles_leftInfoContainer(flag, styles, theme));

  infoContainer.innerHTML = `
    <div style="width: 100%; display: flex; align-items: center; justify-content: space-between;">
      <div style="flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 14px; color: ${
          _styles[theme].leftTextColor
        }; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; text-align: center;" title="${extInfo.name}">
          ${extInfo.name}
        </span>
      </div>
      ${
        showDownloadBtn
          ? `
      <span class="${flag}-ihm-timeSlider-download-btn" style="width: 24px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        ${downloadSVG(flag, styles, theme)}
      </span>
      `
          : ""
      }
    </div>
  `;

  // 绑定下载按钮事件
  const downloadBtn = infoContainer.querySelector(`.${flag}-ihm-timeSlider-download-btn`);
  if (downloadBtn && onDownloadClick) {
    downloadBtn.addEventListener("click", (event) => {
      onDownloadClick({
        info: extInfo,
        event,
      });
    });
  }

  trackRow.appendChild(infoContainer);

  // 创建拖拽容器
  const dragContainer = createElement("div", `${flag}-ihm-timeSlider-trackContainer-dragContainer`, {
    position: "relative",
    overflow: "hidden",
    flexGrow: 1,
    height: "100%",
  });

  // 创建滑块容器
  const sliderContainer = createElement("div", `${flag}-ihm-timeSlider-trackContainer-trackRow-slider`, {
    position: "absolute",
    display: "flex",
    alignItems: "center",
    height: "100%",
    left: "0",
    top: "0",
  });

  // 创建标记线
  const markerLine = createTimeMarker(flag, styles, theme);
  sliderContainer.appendChild(markerLine);
  trackRow.markerLine = markerLine;

  // 创建时间指示线
  const timeIndicatorLine = createTimeMarker(flag, styles, theme, true);
  sliderContainer.appendChild(timeIndicatorLine);

  // 重置刻度线位置并启动移动
  if (markerLineInfo && markerLineInfo.length > 0 && markerLineInfo[trackIndex]) {
    const info = markerLineInfo[trackIndex];
    if (info) {
      const { time: infoTime, criticalTime: infoCriticalTime } = info;
      const newLeft = calculatePositionFromTime(infoTime, scaleWidth, scaleSeconds);
      const newCritical = calculatePositionFromTime(infoCriticalTime, scaleWidth, scaleSeconds);

      markerLine.style.left = `${newLeft}px`;

      // 启动刻度线的移动
      startMarkerMovement(markerLine, newCritical, infoCriticalTime, scaleWidth, scaleSeconds);
    }
  }

  // 渲染时间块
  const timeBlocks = createTimeBlocks(recordings, extInfo, scaleWidth, scaleSeconds, theme);

  timeBlocks.forEach((block, blockIndex) => {
    const recordingSegment = createElement("div", `${flag}-ihm-timeSlider-trackContainer-trackRow-slider-block`, {
      height: "100%",
      width: `${block.width}px`,
      backgroundColor: `${block.color}`,
    });

    const themeBlockColor = theme === "dark-theme" ? "#626773" : "#dbdee7";

    // 只有蓝色的滑块需要绑定事件
    if (block.color === themeBlockColor) {
      recordingSegment.addEventListener("dblclick", (event) => {
        // 滑块容器距离左侧的距离
        const container_left = sliderContainer.getBoundingClientRect().left;
        // 鼠标点击距离左侧的距离
        const click_left = event.clientX;
        // 蓝色滑块距离左侧的距离
        const block_left = click_left - container_left;

        let time = calculateTimeFromPosition(block_left, scaleWidth, scaleSeconds);
        const timeObj = generateTimeObj(config.date, time);

        // 获取当前轨道的刻度线，并移动到点击位置
        markerLine.style.left = `${block_left}px`;

        // 计算临界宽度
        const { width: blueBlock_width, left: blueBlock_left } = recordingSegment.getBoundingClientRect();
        const critical = blueBlock_width + blueBlock_left - container_left;
        const criticalTime = block.end;

        // 启动刻度线的移动
        startMarkerMovement(markerLine, critical, criticalTime, scaleWidth, scaleSeconds);

        // 触发双击事件回调
        if (onSegmentDblClick) {
          onSegmentDblClick({ ...timeObj, info: block.extInfo, event });
        }
      });
    }
    // 为无色模块添加点击事件
    else if (block.color === "transparent") {
      recordingSegment.addEventListener("dblclick", (event) => {
        // 寻找下一个蓝色模块
        let nextBlueBlockIndex = -1;
        for (let i = blockIndex + 1; i < timeBlocks.length; i++) {
          if (timeBlocks[i].color === themeBlockColor) {
            nextBlueBlockIndex = i;
            break;
          }
        }

        // 如果找到下一个蓝色模块
        if (nextBlueBlockIndex !== -1) {
          const nextBlueBlock = timeBlocks[nextBlueBlockIndex];

          // 获取容器左侧距离
          const container_left = sliderContainer.getBoundingClientRect().left;

          // 计算下一个蓝色模块的左边位置
          const nextBlueBlock_left = calculatePositionFromTime(nextBlueBlock.start, scaleWidth, scaleSeconds);

          // 获取对应时间
          const time = nextBlueBlock.start;
          const timeObj = generateTimeObj(config.date, time);

          // 获取当前轨道的刻度线，并移动到下一个蓝色模块左侧
          markerLine.style.left = `${nextBlueBlock_left}px`;

          // 计算临界宽度
          const critical = calculatePositionFromTime(nextBlueBlock.end, scaleWidth, scaleSeconds);
          const criticalTime = nextBlueBlock.end;

          // 启动刻度线的移动
          startMarkerMovement(markerLine, critical, criticalTime, scaleWidth, scaleSeconds);

          // 触发双击事件回调
          if (onSegmentDblClick) {
            onSegmentDblClick({ ...timeObj, info: nextBlueBlock.extInfo, event });
          }
        } else {
          console.log("无蓝色模块");
        }
      });
    }

    sliderContainer.appendChild(recordingSegment);
  });

  // 绑定悬停事件
  bindHoverEvents(sliderContainer, timeIndicatorLine, timeIndicatorText, timelineContainer, scaleWidth, scaleSeconds, styles);

  dragContainer.appendChild(sliderContainer);
  trackRow.appendChild(dragContainer);

  return {
    trackRow,
    sliderContainer,
    markerLine,
  };
}

/**
 * 创建所有轨道
 * @param {Object} config - 轨道组配置
 * @returns {HTMLElement} - 轨道容器
 */
export function createTracks(config) {
  const {
    flag,
    theme,
    styles,
    data,
    date,
    trackHeight,
    emptySVG,
    scaleWidth,
    scaleSeconds,
    timeIndicatorText,
    timelineContainer,
    markerLineInfo,
    onDownloadClick,
    onSegmentDblClick,
  } = config;

  // 创建轨道容器
  const tracksContainer = createElement("div", `${flag}-ihm-timeSlider-trackContainer`, {
    position: "relative",
    maxHeight: customStyle(styles.scrollHeight, "none"),
    overflow: "auto",
  });

  const currentDateStr = date.toISOString().split("T")[0];
  const recordingsPerTrack = data.map((data) => data[currentDateStr] || []);
  const extInfoArr = data.map((data) => data.extInfo || {});

  // 如果没有数据，显示空状态
  if (!recordingsPerTrack || recordingsPerTrack.length === 0) {
    const emptyContainer = createElement("div", `${flag}-ihm-timeSlider-empty`, {
      border: `1px solid ${_styles[theme].borderColor}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      minHeight: "100px",
      color: _styles[theme].emptyTextColor,
      fontSize: "14px",
    });

    emptyContainer.innerHTML = emptySVG(flag, styles, theme);
    tracksContainer.appendChild(emptyContainer);
    return tracksContainer;
  }

  // 清理标记线
  if (tracksContainer) {
    for (let i = 0; i < tracksContainer.children.length; i++) {
      const track = tracksContainer.children[i];
      if (track.markerLine && track.markerLine.movementInterval) {
        clearInterval(track.markerLine.movementInterval);
        track.markerLine.movementInterval = null;
      }
    }
  }

  // 使用文档片段来减少DOM操作次数
  const fragment = document.createDocumentFragment();

  // 创建每个轨道
  recordingsPerTrack.forEach((recordings, trackIndex) => {
    const isLastTrack = trackIndex === recordingsPerTrack.length - 1;
    const extInfo = extInfoArr[trackIndex];

    const trackConfig = {
      flag,
      theme,
      styles,
      trackIndex,
      recordings,
      extInfo,
      isLastTrack,
      scaleWidth,
      scaleSeconds,
      trackHeight,
      date,
      onDownloadClick,
      onSegmentDblClick,
      timeIndicatorText,
      timelineContainer,
      markerLineInfo,
      showDownloadBtn: config.showDownloadBtn,
    };

    const { trackRow } = createTrack(trackConfig);
    fragment.appendChild(trackRow);
  });

  // 一次性添加所有轨道
  tracksContainer.appendChild(fragment);

  return tracksContainer;
}
