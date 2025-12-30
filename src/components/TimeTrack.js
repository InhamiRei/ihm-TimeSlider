import { _styles } from '../common/variable.js';
import { createElement, generateTimeObj, customStyle } from '../utils/common.js';
import { __styles_leftInfoContainer } from '../common/styles.js';
import { downloadSVG } from '../common/svg.js';
import { createTimeMarker } from './TimeMarker.js';
import { bindHoverEvents } from '../utils/eventBind.js';
import { startMarkerMovement } from '../utils/markLine.js';
import { calculateTimeFromPosition, parseTimeToSeconds } from '../utils/auxiliary.js';
import { createTimeBlocks } from '../utils/common.js';

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
    showMarkerLine = true,
    playbackSpeed = 1,
  } = config;

  // 创建轨道行
  const trackRow = createElement('div', `${flag}-ihm-timeSlider-trackContainer-trackRow`, {
    position: 'relative',
    flexGrow: '1',
    height: `${config.trackHeight || 25}px`,
    border: `1px solid ${_styles[theme].borderColor}`,
    borderBottom: isLastTrack ? `1px solid ${_styles[theme].borderColor}` : 'none',
    display: 'flex',
    backgroundColor: _styles[theme].trackBackgroundColor,
  });

  // 创建左侧信息容器
  const infoContainer = createElement(
    'div',
    `${flag}-ihm-timeSlider-trackContainer-trackRow-info`,
    __styles_leftInfoContainer(flag, styles, theme)
  );

  infoContainer.innerHTML = `
    <div style="width: 100%; display: flex; align-items: center; justify-content: space-between;">
      <div style="flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 14px; color: ${
          _styles[theme].leftTextColor
        }; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; text-align: center;" title="${
          extInfo.name
        }">
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
          : ''
      }
    </div>
  `;

  // 绑定下载按钮事件
  const downloadBtn = infoContainer.querySelector(`.${flag}-ihm-timeSlider-download-btn`);
  if (downloadBtn && onDownloadClick) {
    downloadBtn.addEventListener('click', (event) => {
      onDownloadClick({
        info: extInfo,
        event,
      });
    });
  }

  trackRow.appendChild(infoContainer);

  // 创建拖拽容器
  const dragContainer = createElement(
    'div',
    `${flag}-ihm-timeSlider-trackContainer-dragContainer`,
    {
      position: 'relative',
      overflow: 'hidden',
      flexGrow: 1,
      height: '100%',
    }
  );

  // 创建滑块容器
  const sliderContainer = createElement(
    'div',
    `${flag}-ihm-timeSlider-trackContainer-trackRow-slider`,
    {
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      height: '100%',
      left: '0',
      top: '0',
    }
  );

  // 创建标记线
  const markerLine = createTimeMarker(flag, styles, theme);
  sliderContainer.appendChild(markerLine);
  trackRow.markerLine = markerLine;

  // 如果不显示标记线，则隐藏它
  if (!showMarkerLine) {
    markerLine.style.display = 'none';
  }

  // 创建时间指示线
  const timeIndicatorLine = createTimeMarker(flag, styles, theme, true);
  sliderContainer.appendChild(timeIndicatorLine);

  // 重置刻度线位置并启动移动
  if (markerLineInfo && markerLineInfo.length > 0 && markerLineInfo[trackIndex]) {
    const info = markerLineInfo[trackIndex];
    if (info && info.time && info.criticalTime) {
      const { time: infoTime, criticalTime: infoCriticalTime, isPaused } = info;

      // 计算新的像素位置（infoTime和infoCriticalTime现在是秒数）
      const newLeft = (infoTime * scaleWidth) / scaleSeconds;
      const newCritical = (infoCriticalTime * scaleWidth) / scaleSeconds;

      // 检查位置是否在合理范围内（避免负数或超出范围）
      if (newLeft >= 0 && newCritical >= newLeft) {
        markerLine.style.left = `${newLeft}px`;

        // 恢复暂停状态
        if (isPaused !== undefined) {
          markerLine.isPaused = isPaused;
        }

        // 重新设置markerLine的info信息
        markerLine.info = {
          time: infoTime,
          criticalTime: infoCriticalTime,
        };

        // 只在未暂停时启动刻度线的移动
        if (!markerLine.isPaused) {
          startMarkerMovement(
            markerLine,
            newCritical,
            infoCriticalTime,
            scaleWidth,
            scaleSeconds,
            playbackSpeed
          );
        }
      } else {
        // 如果位置不合理，隐藏markerLine或重置到起始位置
        console.warn('MarkerLine position out of range, resetting to 0');
        markerLine.style.left = '0px';
        markerLine.info = null;
      }
    }
  }

  // 渲染时间块
  const timeBlocks = createTimeBlocks(recordings, extInfo, scaleWidth, scaleSeconds, theme);

  timeBlocks.forEach((block, blockIndex) => {
    const recordingSegment = createElement(
      'div',
      `${flag}-ihm-timeSlider-trackContainer-trackRow-slider-block`,
      {
        height: '100%',
        width: `${block.width}px`,
        backgroundColor: `${block.color}`,
      }
    );

    const themeBlockColor = theme === 'dark-theme' ? '#4c5889' : '#aacdf4';

    // 只有蓝色的滑块需要绑定事件
    if (block.color === themeBlockColor) {
      recordingSegment.addEventListener('dblclick', (event) => {
        // 滑块容器距离左侧的距离
        const container_left = sliderContainer.getBoundingClientRect().left;
        // 鼠标点击距离左侧的距离
        const click_left = event.clientX;
        // 蓝色滑块距离左侧的距离
        const block_left = click_left - container_left;

        let time = calculateTimeFromPosition(block_left, scaleWidth, scaleSeconds);
        const timeObj = generateTimeObj(config.date, time);

        // 只有在showMarkerLine为true时才显示和移动标记线
        if (showMarkerLine) {
          // 🔥 录像回放逻辑：每次双击时清空当前轨道之前的刻度线状态
          // 停止当前轨道的移动动画
          if (markerLine.movementInterval) {
            clearInterval(markerLine.movementInterval);
            markerLine.movementInterval = null;
          }
          if (markerLine.animationFrameId) {
            cancelAnimationFrame(markerLine.animationFrameId);
            markerLine.animationFrameId = null;
          }

          // 获取当前轨道的刻度线，并移动到点击位置
          markerLine.style.left = `${block_left}px`;

          // 计算临界宽度
          const { width: blueBlock_width, left: blueBlock_left } =
            recordingSegment.getBoundingClientRect();
          const critical = blueBlock_width + blueBlock_left - container_left;
          const criticalTime = parseTimeToSeconds(block.end); // 转换为秒数格式

          // 计算开始时间（秒数）
          const startTime = calculateTimeFromPosition(block_left, scaleWidth, scaleSeconds);

          // 更新刻度线信息
          markerLine.info = {
            time: startTime,
            criticalTime: criticalTime,
          };
          markerLine.isPaused = false;

          // 启动刻度线的移动
          startMarkerMovement(
            markerLine,
            critical,
            criticalTime,
            scaleWidth,
            scaleSeconds,
            playbackSpeed
          );

          // 🔥 关键：通知父组件更新对应轨道的markerLineInfo状态（双击是新操作）
          if (config.onMarkerLineUpdate) {
            config.onMarkerLineUpdate(
              trackIndex,
              {
                time: startTime,
                criticalTime: criticalTime,
                isPaused: false,
              },
              true
            ); // 传递 isNewClick = true
          }
        }

        // 触发双击事件回调
        if (onSegmentDblClick) {
          onSegmentDblClick({ ...timeObj, info: block.extInfo, block, event });
        }
      });
    }
    // 为无色模块添加点击事件
    else if (block.color === 'transparent') {
      recordingSegment.addEventListener('dblclick', (event) => {
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

          // 计算下一个蓝色模块的左边位置（直接从时间字符串计算）
          const startSeconds = parseTimeToSeconds(nextBlueBlock.start);
          const nextBlueBlock_left = (startSeconds * scaleWidth) / scaleSeconds;

          // 获取对应时间
          const time = nextBlueBlock.start;
          const timeObj = generateTimeObj(config.date, time);

          // 只有在showMarkerLine为true时才显示和移动标记线
          if (showMarkerLine) {
            // 🔥 录像回放逻辑：每次双击时清空当前轨道之前的刻度线状态
            // 停止当前轨道的移动动画
            if (markerLine.movementInterval) {
              clearInterval(markerLine.movementInterval);
              markerLine.movementInterval = null;
            }
            if (markerLine.animationFrameId) {
              cancelAnimationFrame(markerLine.animationFrameId);
              markerLine.animationFrameId = null;
            }

            // 获取当前轨道的刻度线，并移动到下一个蓝色模块左侧
            markerLine.style.left = `${nextBlueBlock_left}px`;

            // 计算临界宽度（直接从时间字符串计算）
            const endSeconds = parseTimeToSeconds(nextBlueBlock.end);
            const critical = (endSeconds * scaleWidth) / scaleSeconds;
            const criticalTime = endSeconds; // 使用秒数格式，保持与seekToTime一致

            // 计算开始时间（秒数）
            const startSeconds = parseTimeToSeconds(nextBlueBlock.start);

            // 更新刻度线信息
            markerLine.info = {
              time: startSeconds,
              criticalTime: criticalTime,
            };
            markerLine.isPaused = false;

            // 启动刻度线的移动
            startMarkerMovement(
              markerLine,
              critical,
              criticalTime,
              scaleWidth,
              scaleSeconds,
              playbackSpeed
            );

            // 🔥 关键：通知父组件更新对应轨道的markerLineInfo状态（双击是新操作）
            if (config.onMarkerLineUpdate) {
              config.onMarkerLineUpdate(
                trackIndex,
                {
                  time: startSeconds,
                  criticalTime: criticalTime,
                  isPaused: false,
                },
                true
              ); // 传递 isNewClick = true
            }
          }

          // 触发双击事件回调
          if (onSegmentDblClick) {
            onSegmentDblClick({
              ...timeObj,
              info: nextBlueBlock.extInfo,
              block: nextBlueBlock,
              event,
            });
          }
        } else {
          console.log('无蓝色模块');
        }
      });
    }

    sliderContainer.appendChild(recordingSegment);
  });

  // 绑定悬停事件
  bindHoverEvents(
    sliderContainer,
    timeIndicatorLine,
    timeIndicatorText,
    timelineContainer,
    scaleWidth,
    scaleSeconds,
    styles
  );

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
    showMarkerLine,
    playbackSpeed = 1,
  } = config;

  // 创建轨道容器
  const tracksContainer = createElement('div', `${flag}-ihm-timeSlider-trackContainer`, {
    position: 'relative',
    maxHeight: customStyle(styles.scrollHeight, 'none'),
    overflow: 'auto',
  });

  const currentDateStr = date.toISOString().split('T')[0];
  const recordingsPerTrack = data.map((data) => data[currentDateStr] || []);
  const extInfoArr = data.map((data) => data.extInfo || {});

  // 如果没有数据，显示空状态
  if (!recordingsPerTrack || recordingsPerTrack.length === 0) {
    const emptyContainer = createElement('div', `${flag}-ihm-timeSlider-empty`, {
      border: `1px solid ${_styles[theme].borderColor}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: '100px',
      color: _styles[theme].emptyTextColor,
      fontSize: '14px',
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
      showMarkerLine,
      playbackSpeed,
      onMarkerLineUpdate: config.onMarkerLineUpdate, // 传递回调函数
    };

    const { trackRow } = createTrack(trackConfig);
    fragment.appendChild(trackRow);
  });

  // 一次性添加所有轨道
  tracksContainer.appendChild(fragment);

  return tracksContainer;
}
