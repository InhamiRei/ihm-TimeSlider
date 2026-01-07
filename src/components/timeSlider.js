import { _styles } from '../common/variable.js';
import { createElement, isDom, adjustDate } from '../utils/common.js';
import {
  calculateTimeFromPosition,
  calculatePositionFromTime,
  findNextRecording,
  parseTimeToSeconds,
} from '../utils/auxiliary.js';
import { emptySVG } from '../common/svg.js';
import { createTopBar } from './TimeTopBar.js';
import { createTracks } from './TimeTrack.js';
import { startMarkerMovement, stopMarkLine, resumeMarkLine } from '../utils/markLine.js';

export default class ihm_TimeSlider {
  constructor(config) {
    // console.log("config", config);
    // container是必填的，需要知道加在哪个地方
    if (!config || !config.container) {
      throw new Error("The 'container' parameter is required and must be a valid DOM element.");
    }
    // 确保 container 是一个 DOM 元素
    if (!isDom(config.container)) {
      throw new Error("The 'container' parameter must be a valid DOM element.");
    }

    // 主题
    this.theme = config.theme || 'light-theme';
    // 一些有关宽度的样式
    this.styles = config.styles || {};
    this.version = 'v202501151711_IHM_TIMESLIDER';
    this.flag = config.flag || '__4f8fbfb';

    this.container = config.container;
    this.date = new Date(config.curDay || new Date().toISOString().split('T')[0]); // 当前显示的日期
    this.data = config.data; // 录像数据
    this.showDownloadBtn = config.showDownloadBtn !== undefined ? config.showDownloadBtn : true; // 是否显示下载按钮
    this.showMarkerLine = config.showMarkerLine !== undefined ? config.showMarkerLine : true; // 是否显示标记线，默认为true

    this.padding = { top: 0, bottom: 0, left: 0, right: 0 };

    this.trackHeight = 25; // 每条轨道的高度
    this.trackGap = 0; // 每条轨道的间隔
    this.timelineWidth = this.container.offsetWidth - this.padding.left - this.padding.right - 2;
    this.timelineHeight = this.container.offsetHeight - this.padding.top - this.padding.bottom;

    // 刻度时间，默认是用小时作为单位，则刻度就会显示00:00, 01:00, 02:00, ... 24:00
    this.scaleTime = 24;
    // 刻度宽度，默认是50px
    this.scaleWidth = 50;
    // 刻度秒间隔，默认是3600秒
    this.scaleSeconds = 3600;

    this.scaleMap = {
      24: 3600, // 1小时
      48: 1800, // 30分钟
      288: 300, // 5分钟
      1440: 60, // 1分钟
    };

    this.onDateChange = null; // 日期变更回调
    this.onSegmentDblClick = config.dbClick || null; // 双击事件回调
    this.onSegmentContextMenu = config.rtClick || null; // 右键事件回调
    this.onDownloadClick = config.download || null; // 添加下载按钮回调

    this.tracksContainer = null; // 轨道容器
    this.timeIndicatorText = null; // 时间指示文字

    this.markerLineInfo = []; // 存储刻度线的数据，轨道信息数组，用来还原刻度线的位置
    this.markerLineStates = {}; // 存储不同日期下的markerLine状态
    this.trackGlobalStates = {}; // 🔥 NEW: 每条轨道的全局状态，记录每条轨道当前活跃在哪个日期
    this.playbackSpeed = 1; // 播放倍速，默认为1倍速
    this.overlays = []; // 存储所有overlay数据

    this.render();
    this._addResizeListener();
  }

  // 主渲染方法
  render() {
    // 在渲染前，检查当前日期是否有保存的markerLine状态需要恢复
    const currentDateStr = this.date.toISOString().split('T')[0];
    if (!this.markerLineInfo || this.markerLineInfo.length === 0) {
      this.markerLineInfo = this._getMarkerLineStateForDate(currentDateStr) || [];
    }

    // 清空容器
    this.container.innerHTML = '';

    // 创建时间轴容器
    const mainContainer = createElement('div', `${this.flag}-ihm-timeSlider-mainContainer`, {
      position: 'relative',
      paddingLeft: `${this.padding.left}px`,
      paddingRight: `${this.padding.right}px`,
      userSelect: 'none',
    });

    // 创建顶部栏
    const topBarConfig = {
      flag: this.flag,
      theme: this.theme,
      styles: this.styles,
      date: this.date,
      timelineWidth: this.timelineWidth,
      scaleTime: this.scaleTime,
      scaleSeconds: this.scaleSeconds,
      onPrevDayClick: () => this.prevDay(),
      onNextDayClick: () => this.nextDay(),
      onZoomInClick: () => this.adjustTimeLine('in'),
      onZoomOutClick: () => this.adjustTimeLine('out'),
      onDateClick: () => this.showTimeSelector(),
    };

    const { topbarContainer, timeIndicatorText, scaleWidth } = createTopBar(topBarConfig);
    this.timeIndicatorText = timeIndicatorText;
    this.scaleWidth = scaleWidth;

    // 添加顶部
    mainContainer.appendChild(topbarContainer);

    // 创建轨道
    const tracksConfig = {
      flag: this.flag,
      theme: this.theme,
      styles: this.styles,
      data: this.data,
      date: this.date,
      trackHeight: this.trackHeight,
      emptySVG,
      scaleWidth: this.scaleWidth,
      scaleSeconds: this.scaleSeconds,
      timeIndicatorText: this.timeIndicatorText,
      timelineContainer: topbarContainer.querySelector(
        `.${this.flag}-ihm-timeSlider-topbarContainer-scaleAxis`,
      ),
      markerLineInfo: this.markerLineInfo,
      onDownloadClick: this.onDownloadClick,
      onSegmentDblClick: this.onSegmentDblClick,
      showDownloadBtn: this.showDownloadBtn,
      showMarkerLine: this.showMarkerLine,
      playbackSpeed: this.playbackSpeed,
      onMarkerLineUpdate: (trackIndex, info) => this._handleMarkerLineUpdate(trackIndex, info), // 添加刻度线更新回调
    };

    this.tracksContainer = createTracks(tracksConfig);

    // 渲染所有overlay
    this._renderOverlays();

    // 添加录像轨道
    mainContainer.appendChild(this.tracksContainer);
    this.container.appendChild(mainContainer);

    // 触发日期变更回调
    if (this.onDateChange) {
      this.onDateChange(this.date.toISOString().split('T')[0]);
    }
  }

  // 显示时间选择器
  showTimeSelector() {
    const dateStr = this.date.toISOString().split('T')[0];
    const newDateStr = prompt('请输入日期 (YYYY-MM-DD)', dateStr);
    if (newDateStr && /^\d{4}-\d{2}-\d{2}$/.test(newDateStr)) {
      // 保存当前日期的markerLine状态
      this._saveCurrentMarkerLineState();

      this.date = new Date(newDateStr);

      // 获取新日期的markerLine状态
      this.markerLineInfo = this._getMarkerLineStateForDate(newDateStr) || [];

      this.render();
    }
  }

  /**
   * 保存当前日期的markerLine状态
   */
  _saveCurrentMarkerLineState() {
    const currentDateStr = this.date.toISOString().split('T')[0];

    // 保存当前日期的markerLine状态
    this.markerLineStates[currentDateStr] = [];
    if (this.tracksContainer) {
      for (let i = 0; i < this.tracksContainer.children.length; i++) {
        const track = this.tracksContainer.children[i];
        if (track.markerLine && track.markerLine.info) {
          this.markerLineStates[currentDateStr].push({
            time: track.markerLine.info.time,
            criticalTime: track.markerLine.info.criticalTime,
            isPaused: track.markerLine.isPaused || false,
          });
        } else {
          this.markerLineStates[currentDateStr].push(null);
        }
      }
    }
  }

  /**
   * 获取指定日期的markerLine状态
   * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
   * @returns {Array|null} markerLine状态数组或null
   */
  _getMarkerLineStateForDate(dateStr) {
    const savedStates = this.markerLineStates[dateStr] || [];
    const resultStates = [];

    // 🔥 NEW: 检查每条轨道的全局状态，只恢复在当前日期活跃的轨道状态
    Object.keys(this.trackGlobalStates).forEach((trackIndexStr) => {
      const trackIndex = parseInt(trackIndexStr);
      const globalState = this.trackGlobalStates[trackIndex];

      // 如果轨道的活跃日期是当前日期，则恢复保存的状态
      if (globalState && globalState.activeDate === dateStr && savedStates[trackIndex]) {
        resultStates[trackIndex] = savedStates[trackIndex];
      } else {
        // 否则该轨道在当前日期应该是空状态
        resultStates[trackIndex] = null;
      }
    });

    // 如果没有任何轨道的全局状态，返回原始保存的状态（向后兼容）
    if (Object.keys(this.trackGlobalStates).length === 0) {
      return savedStates.length > 0 ? savedStates : null;
    }

    return resultStates.length > 0 ? resultStates : null;
  }

  // 切换到前一天
  prevDay() {
    // 保存当前日期的markerLine状态
    this._saveCurrentMarkerLineState();

    this.date = adjustDate(this.date, 'prev');

    // 获取新日期的markerLine状态
    const newDateStr = this.date.toISOString().split('T')[0];
    this.markerLineInfo = this._getMarkerLineStateForDate(newDateStr) || [];

    this.render();
  }

  // 切换到后一天
  nextDay() {
    // 保存当前日期的markerLine状态
    this._saveCurrentMarkerLineState();

    this.date = adjustDate(this.date, 'next');

    // 获取新日期的markerLine状态
    const newDateStr = this.date.toISOString().split('T')[0];
    this.markerLineInfo = this._getMarkerLineStateForDate(newDateStr) || [];

    this.render();
  }

  /**
   * 调整时间轴的缩放级别
   * @param {string} direction - 调整方向，"in" 表示放大，"out" 表示缩小
   */
  adjustTimeLine(direction) {
    const scales = Object.keys(this.scaleMap)
      .map(Number)
      .sort((a, b) => a - b); // 获取所有刻度并排序
    const currentIndex = scales.indexOf(this.scaleTime); // 找到当前刻度的索引

    // 保存标记线信息 - 重要：保存时间信息而不是像素位置
    this.markerLineInfo = [];
    if (this.tracksContainer) {
      for (let i = 0; i < this.tracksContainer.children.length; i++) {
        const track = this.tracksContainer.children[i];
        if (track.markerLine && track.markerLine.info) {
          // 保存完整的markerLine信息，包括时间和isPaused状态
          this.markerLineInfo.push({
            time: track.markerLine.info.time,
            criticalTime: track.markerLine.info.criticalTime,
            isPaused: track.markerLine.isPaused || false,
          });
        } else {
          // 如果没有markerLine信息，推入null以保持索引对应
          this.markerLineInfo.push(null);
        }
      }
    }

    if (direction === 'in' && currentIndex < scales.length - 1) {
      // 放大：切换到下一个更大的刻度
      this.scaleTime = scales[currentIndex + 1];
      this.scaleSeconds = this.scaleMap[this.scaleTime]; // 获取新的刻度秒数
      this.render();
    } else if (direction === 'out' && currentIndex > 0) {
      // 缩小：切换到上一个更小的刻度
      this.scaleTime = scales[currentIndex - 1];
      this.scaleSeconds = this.scaleMap[this.scaleTime]; // 获取新的刻度秒数
      this.render();
    }
  }

  // 设置日期变更回调
  setDateChangeCallback(callback) {
    this.onDateChange = callback;
  }

  // 修改模式: 亮色模式 / 暗色模式
  setTheme(theme) {
    if (theme !== 'light-theme' && theme !== 'dark-theme') return;

    // 保存当前markerLine状态
    this._saveCurrentMarkerLineState();

    this.theme = theme;
    this.render();
  }

  // 停止刻度线移动
  stopMarkLine(trackIndex) {
    stopMarkLine(this.tracksContainer, trackIndex);

    // 🔥 同步状态：更新对应轨道的暂停状态
    if (trackIndex !== undefined) {
      const track = this.tracksContainer.children[trackIndex];
      if (track && track.markerLine && track.markerLine.info) {
        this._handleMarkerLineUpdate(trackIndex, {
          time: track.markerLine.info.time,
          criticalTime: track.markerLine.info.criticalTime,
          isPaused: true,
        });
      }
    } else {
      // 更新所有轨道的暂停状态
      for (let i = 0; i < this.tracksContainer.children.length; i++) {
        const track = this.tracksContainer.children[i];
        if (track && track.markerLine && track.markerLine.info) {
          this._handleMarkerLineUpdate(i, {
            time: track.markerLine.info.time,
            criticalTime: track.markerLine.info.criticalTime,
            isPaused: true,
          });
        }
      }
    }
  }

  // 恢复刻度线移动
  resumeMarkLine(trackIndex) {
    resumeMarkLine(this.tracksContainer, trackIndex);

    // 🔥 同步状态：更新对应轨道的恢复状态
    if (trackIndex !== undefined) {
      const track = this.tracksContainer.children[trackIndex];
      if (track && track.markerLine && track.markerLine.info) {
        this._handleMarkerLineUpdate(trackIndex, {
          time: track.markerLine.info.time,
          criticalTime: track.markerLine.info.criticalTime,
          isPaused: false,
        });
      }
    } else {
      // 更新所有轨道的恢复状态
      for (let i = 0; i < this.tracksContainer.children.length; i++) {
        const track = this.tracksContainer.children[i];
        if (track && track.markerLine && track.markerLine.info) {
          this._handleMarkerLineUpdate(i, {
            time: track.markerLine.info.time,
            criticalTime: track.markerLine.info.criticalTime,
            isPaused: false,
          });
        }
      }
    }
  }

  // 获取时间轴的信息
  getInfo() {
    const info = {
      date: this.date.toISOString().split('T')[0], // 当前显示的日期
      tracks: [],
      scaleTime: this.scaleTime,
      scaleSeconds: this.scaleSeconds,
      playbackSpeed: this.playbackSpeed, // 添加播放倍速信息
    };

    // 如果轨道容器不存在，直接返回基本信息
    if (!this.tracksContainer || !this.tracksContainer.children) {
      return info;
    }

    // 遍历所有轨道，收集信息
    for (let i = 0; i < this.tracksContainer.children.length; i++) {
      const track = this.tracksContainer.children[i];
      const trackInfo = {
        index: i,
        extInfo: (this.data[i] && this.data[i].extInfo) || {},
      };

      // 获取刻度线信息
      if (track.markerLine) {
        const markerLeft = parseFloat(track.markerLine.style.left) || 0;
        const currentTime = calculateTimeFromPosition(
          markerLeft,
          this.scaleWidth,
          this.scaleSeconds,
        );

        trackInfo.marker = {
          position: markerLeft,
          isPaused: track.markerLine.isPaused || false,
          time: currentTime,
        };
      }

      info.tracks.push(trackInfo);
    }

    return info;
  }

  /**
   * 设置播放倍速
   * @param {number} speed - 播放倍速 (0.25, 0.5, 1, 2, 4 等)
   * @param {number} trackIndex - 轨道索引，不传则设置所有轨道
   */
  setPlaybackSpeed(speed, trackIndex) {
    if (typeof speed !== 'number' || speed <= 0) {
      console.warn('播放倍速必须是大于0的数字');
      return;
    }

    this.playbackSpeed = speed;

    if (!this.tracksContainer || !this.tracksContainer.children) {
      return;
    }

    // 更新指定轨道或所有轨道的播放倍速
    if (trackIndex !== undefined) {
      const track = this.tracksContainer.children[trackIndex];
      if (track && track.markerLine && track.markerLine.info) {
        this._updateTrackPlaybackSpeed(track, speed, trackIndex);
      }
    } else {
      // 更新所有轨道
      for (let i = 0; i < this.tracksContainer.children.length; i++) {
        const track = this.tracksContainer.children[i];
        if (track && track.markerLine && track.markerLine.info) {
          this._updateTrackPlaybackSpeed(track, speed, i);
        }
      }
    }
  }

  /**
   * 更新单个轨道的播放倍速
   * @param {HTMLElement} track - 轨道元素
   * @param {number} speed - 播放倍速
   * @param {number} trackIndex - 轨道索引
   */
  _updateTrackPlaybackSpeed(track, speed, trackIndex) {
    const markerLine = track.markerLine;
    const { time, criticalTime } = markerLine.info;

    // 如果刻度线正在移动（未暂停），重新启动以应用新的倍速
    if (!markerLine.isPaused) {
      const currentLeft = parseFloat(markerLine.style.left) || 0;
      // 直接使用秒数计算位置
      const critical = (criticalTime * this.scaleWidth) / this.scaleSeconds;

      // 重新启动移动，使用新的倍速
      startMarkerMovement(
        markerLine,
        critical,
        criticalTime,
        this.scaleWidth,
        this.scaleSeconds,
        speed,
      );

      // 同时更新markerLineInfo，确保状态一致性
      this._handleMarkerLineUpdate(trackIndex, {
        time,
        criticalTime,
        isPaused: false,
      });
    }
  }

  /**
   * 更新指定轨道的markerLineInfo状态
   * @param {number} trackIndex - 轨道索引
   * @param {Object} info - 刻度线信息 {time, criticalTime, isPaused}
   */
  _updateMarkerLineInfo(trackIndex, info) {
    // 确保markerLineInfo数组有足够的长度
    if (!this.markerLineInfo) {
      this.markerLineInfo = [];
    }

    // 确保数组长度足够
    while (this.markerLineInfo.length <= trackIndex) {
      this.markerLineInfo.push(null);
    }

    // 更新指定轨道的信息
    this.markerLineInfo[trackIndex] = info;

    // console.log(`已更新轨道 ${trackIndex} 的markerLineInfo:`, info);
  }

  /**
   * 处理轨道刻度线更新的回调
   * @param {number} trackIndex - 轨道索引
   * @param {Object} info - 刻度线信息 {time, criticalTime, isPaused}
   * @param {boolean} isNewClick - 是否是新的双击操作（需要清空其他日期的状态）
   */
  _handleMarkerLineUpdate(trackIndex, info, isNewClick = false) {
    const currentDateStr = this.date.toISOString().split('T')[0];

    // 🔥 NEW: 如果是新的双击操作，清空该轨道在所有其他日期的状态
    if (isNewClick) {
      this._clearTrackStateFromOtherDates(trackIndex, currentDateStr);
    }

    // 更新内存中的markerLineInfo
    this._updateMarkerLineInfo(trackIndex, info);

    // 同时更新当前日期的状态存储，确保日期切换时能正确保存状态
    if (!this.markerLineStates[currentDateStr]) {
      this.markerLineStates[currentDateStr] = [];
    }

    // 确保数组长度足够
    while (this.markerLineStates[currentDateStr].length <= trackIndex) {
      this.markerLineStates[currentDateStr].push(null);
    }

    // 更新对应轨道的状态
    this.markerLineStates[currentDateStr][trackIndex] = info;

    // 🔥 NEW: 更新轨道的全局状态，记录该轨道当前活跃在当前日期
    this.trackGlobalStates[trackIndex] = {
      activeDate: currentDateStr,
      lastUpdated: Date.now(),
    };
  }

  /**
   * 清空指定轨道在其他所有日期的状态
   * @param {number} trackIndex - 轨道索引
   * @param {string} keepDateStr - 要保留的日期，其他日期的状态都会被清空
   */
  _clearTrackStateFromOtherDates(trackIndex, keepDateStr) {
    // 遍历所有日期的状态，清空指定轨道在其他日期的状态
    Object.keys(this.markerLineStates).forEach((dateStr) => {
      if (dateStr !== keepDateStr && this.markerLineStates[dateStr]) {
        // 确保数组长度足够
        while (this.markerLineStates[dateStr].length <= trackIndex) {
          this.markerLineStates[dateStr].push(null);
        }
        // 清空该轨道在这个日期的状态
        this.markerLineStates[dateStr][trackIndex] = null;
      }
    });

    console.log(`已清空轨道 ${trackIndex} 在除 ${keepDateStr} 外所有日期的状态`);
  }

  /**
   * 定位刻度线到指定时间位置
   * @param {string} targetTime - 目标时间 (格式: "HH:MM:SS" 或 "HH:MM")
   * @param {number} trackIndex - 轨道索引，不传则定位所有轨道
   */
  seekToTime(targetTime, trackIndex) {
    if (!targetTime || typeof targetTime !== 'string') {
      console.warn('目标时间格式错误，应为字符串格式 "HH:MM:SS" 或 "HH:MM"');
      return;
    }

    // 解析时间字符串
    const timeMatch = targetTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!timeMatch) {
      console.warn('时间格式错误，应为 "HH:MM:SS" 或 "HH:MM" 格式');
      return;
    }

    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = parseInt(timeMatch[3] || '0', 10);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
      console.warn('时间值超出有效范围');
      return;
    }

    // 将时间转换为当天的秒数
    const targetSeconds = hours * 3600 + minutes * 60 + seconds;

    if (!this.tracksContainer || !this.tracksContainer.children) {
      return;
    }

    const currentDateStr = this.date.toISOString().split('T')[0];

    // 定位指定轨道或所有轨道
    if (trackIndex !== undefined) {
      if (trackIndex >= 0 && trackIndex < this.tracksContainer.children.length) {
        this._seekTrackToTime(trackIndex, targetSeconds, currentDateStr);
      }
    } else {
      // 定位所有轨道
      for (let i = 0; i < this.tracksContainer.children.length; i++) {
        this._seekTrackToTime(i, targetSeconds, currentDateStr);
      }
    }
  }

  /**
   * 定位单个轨道的刻度线到指定时间
   * @param {number} trackIndex - 轨道索引
   * @param {number} targetSeconds - 目标时间（秒）
   * @param {string} currentDateStr - 当前日期字符串
   */
  _seekTrackToTime(trackIndex, targetSeconds, currentDateStr) {
    const track = this.tracksContainer.children[trackIndex];
    if (!track || !track.markerLine) {
      return;
    }

    const trackData = this.data[trackIndex];
    if (!trackData) {
      return;
    }

    // 🔥 录像回放逻辑：清空当前轨道之前的刻度线状态
    const markerLine = track.markerLine;
    // 停止之前的移动动画
    if (markerLine.movementInterval) {
      clearInterval(markerLine.movementInterval);
      markerLine.movementInterval = null;
    }
    if (markerLine.animationFrameId) {
      cancelAnimationFrame(markerLine.animationFrameId);
      markerLine.animationFrameId = null;
    }

    const recordings = trackData[currentDateStr] || [];
    if (recordings.length === 0) {
      console.warn(`轨道 ${trackIndex} 在当前日期没有录像数据`);
      return;
    }

    // 查找目标时间对应的录像段
    let targetPosition = null;
    let targetRecording = null;

    for (const recording of recordings) {
      const startTime = new Date(`${currentDateStr} ${recording.startTime.split(' ')[1]}`);
      const endTime = new Date(`${currentDateStr} ${recording.endTime.split(' ')[1]}`);

      const startSeconds =
        startTime.getHours() * 3600 + startTime.getMinutes() * 60 + startTime.getSeconds();
      const endSeconds =
        endTime.getHours() * 3600 + endTime.getMinutes() * 60 + endTime.getSeconds();

      // 如果目标时间在录像段内
      if (targetSeconds >= startSeconds && targetSeconds <= endSeconds) {
        // 直接使用秒数计算位置
        targetPosition = (targetSeconds * this.scaleWidth) / this.scaleSeconds;
        targetRecording = recording;
        break;
      }
    }

    // 如果目标时间不在任何录像段内，找到右边第一个录像段的左边（与双击行为一致）
    if (!targetRecording) {
      const nextRecording = findNextRecording(recordings, targetSeconds, currentDateStr);

      if (nextRecording) {
        // 定位到下一个录像段的左边（与双击行为一致）
        const startTime = new Date(`${currentDateStr} ${nextRecording.startTime.split(' ')[1]}`);
        const startSeconds =
          startTime.getHours() * 3600 + startTime.getMinutes() * 60 + startTime.getSeconds();
        // 直接使用秒数计算位置
        targetPosition = (startSeconds * this.scaleWidth) / this.scaleSeconds;
        targetRecording = nextRecording;
        // 重新设置目标秒数为录像段的开始时间
        targetSeconds = startSeconds;
      }
    }

    if (targetPosition !== null && targetRecording) {
      const markerLine = track.markerLine;

      // 设置刻度线位置
      markerLine.style.left = `${targetPosition}px`;

      // 让刻度线可见（移除隐藏状态）
      markerLine.style.display = 'block';

      // 调试信息（可选，生产环境可移除）
      // console.log(`轨道 ${trackIndex} 定位信息:`, {
      //   targetPosition: targetPosition + "px",
      //   scaleWidth: this.scaleWidth,
      //   scaleSeconds: this.scaleSeconds,
      //   targetSeconds,
      //   markerLineVisible: markerLine.style.display,
      //   markerLineLeft: markerLine.style.left,
      //   markerLineWidth: markerLine.style.width,
      //   markerLineColor: markerLine.style.backgroundColor,
      // });

      // 计算录像段的结束位置作为临界点
      const endTime = new Date(`${currentDateStr} ${targetRecording.endTime.split(' ')[1]}`);
      const criticalSeconds =
        endTime.getHours() * 3600 + endTime.getMinutes() * 60 + endTime.getSeconds();
      // 直接使用秒数计算位置
      const criticalPosition = (criticalSeconds * this.scaleWidth) / this.scaleSeconds;

      // 更新刻度线信息
      markerLine.info = {
        time: targetSeconds,
        criticalTime: criticalSeconds,
      };

      // 重置暂停状态并启动移动
      markerLine.isPaused = false;
      startMarkerMovement(
        markerLine,
        criticalPosition,
        criticalSeconds,
        this.scaleWidth,
        this.scaleSeconds,
        this.playbackSpeed,
      );

      // 🔥 关键修复：立即更新全局markerLineInfo数组，确保状态在缩放/日期切换时能正确保存和恢复
      this._handleMarkerLineUpdate(
        trackIndex,
        {
          time: targetSeconds,
          criticalTime: criticalSeconds,
          isPaused: false,
        },
        true,
      ); // seekToTime 也是新操作，清空该轨道在其他日期的状态

      console.log(
        `轨道 ${trackIndex} 刻度线已定位到 ${Math.floor(targetSeconds / 3600)
          .toString()
          .padStart(2, '0')}:${Math.floor((targetSeconds % 3600) / 60)
          .toString()
          .padStart(2, '0')}:${(targetSeconds % 60).toString().padStart(2, '0')}`,
      );
    } else {
      console.warn(`轨道 ${trackIndex} 无法找到合适的定位位置`);
    }
  }

  /**
   * 添加覆盖层
   * @param {Object} options - 覆盖层配置
   * @param {number} options.index - 轨道索引
   * @param {string} options.startTime - 开始时间 (格式: "YYYY-MM-DD HH:MM:SS")
   * @param {string} options.endTime - 结束时间 (格式: "YYYY-MM-DD HH:MM:SS")
   * @param {string} [options.color='#73D473'] - 背景颜色，默认绿色
   * @param {number} [options.opacity=1] - 透明度，默认1
   * @param {number} [options.zIndex=5] - 层级，默认5
   * @param {boolean} [options.clear=false] - 是否先清除该轨道已有的overlay，默认false
   * @returns {string} overlay的唯一ID，用于后续移除
   */
  addOverlay(options) {
    const {
      index,
      startTime,
      endTime,
      color = '#73D473',
      opacity = 1,
      zIndex = 5,
      clear = false,
    } = options;

    if (index === undefined || index < 0) {
      console.warn('addOverlay: 必须提供有效的轨道索引 index');
      return null;
    }

    if (!startTime || !endTime) {
      console.warn('addOverlay: 必须提供 startTime 和 endTime');
      return null;
    }

    // 验证时间格式必须为 "YYYY-MM-DD HH:MM:SS"
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!dateTimeRegex.test(startTime)) {
      console.warn('addOverlay: startTime 格式错误，必须为 "YYYY-MM-DD HH:MM:SS" 格式');
      return null;
    }
    if (!dateTimeRegex.test(endTime)) {
      console.warn('addOverlay: endTime 格式错误，必须为 "YYYY-MM-DD HH:MM:SS" 格式');
      return null;
    }

    // 验证开始时间必须早于结束时间
    const startDate = new Date(startTime.replace(' ', 'T'));
    const endDate = new Date(endTime.replace(' ', 'T'));
    if (startDate >= endDate) {
      console.warn('addOverlay: startTime 必须早于 endTime');
      return null;
    }

    // 如果需要先清除该轨道的overlay
    if (clear) {
      this.clearOverlay(index);
    }

    // 解析时间
    const parseDateTime = (timeStr) => {
      const [datePart, timePart] = timeStr.split(' ');
      return { date: datePart, time: timePart };
    };

    const startParsed = parseDateTime(startTime);
    const endParsed = parseDateTime(endTime);

    // 生成唯一ID
    const overlayId = `overlay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 存储overlay数据
    const overlayData = {
      id: overlayId,
      index,
      startDate: startParsed.date,
      startTime: startParsed.time,
      endDate: endParsed.date,
      endTime: endParsed.time,
      color,
      opacity,
      zIndex,
    };

    this.overlays.push(overlayData);

    // 立即渲染该overlay
    this._renderSingleOverlay(overlayData);

    return overlayId;
  }

  /**
   * 移除指定的覆盖层
   * @param {string} overlayId - overlay的唯一ID
   */
  removeOverlay(overlayId) {
    const overlayIndex = this.overlays.findIndex((o) => o.id === overlayId);
    if (overlayIndex === -1) {
      console.warn('removeOverlay: 未找到指定的overlay');
      return;
    }

    // 从数组中移除
    this.overlays.splice(overlayIndex, 1);

    // 从DOM中移除
    if (this.tracksContainer) {
      const overlayElement = this.tracksContainer.querySelector(`[data-overlay-id="${overlayId}"]`);
      if (overlayElement) {
        overlayElement.remove();
      }
    }
  }

  /**
   * 清除指定轨道的所有覆盖层
   * @param {number} trackIndex - 轨道索引
   */
  clearOverlay(trackIndex) {
    if (trackIndex === undefined || trackIndex < 0) {
      console.warn('clearOverlay: 必须提供有效的轨道索引');
      return;
    }

    // 从数组中移除该轨道的所有overlay
    this.overlays = this.overlays.filter((o) => o.index !== trackIndex);

    // 从DOM中移除该轨道的所有overlay
    if (this.tracksContainer) {
      const track = this.tracksContainer.children[trackIndex];
      if (track) {
        const overlayElements = track.querySelectorAll(`.${this.flag}-ihm-timeSlider-overlay`);
        overlayElements.forEach((el) => el.remove());
      }
    }
  }

  /**
   * 清除所有覆盖层
   */
  clearOverlays() {
    this.overlays = [];

    // 从DOM中移除所有overlay
    if (this.tracksContainer) {
      const overlayElements = this.tracksContainer.querySelectorAll(
        `.${this.flag}-ihm-timeSlider-overlay`,
      );
      overlayElements.forEach((el) => el.remove());
    }
  }

  /**
   * 渲染所有overlay
   * @private
   */
  _renderOverlays() {
    if (!this.overlays || this.overlays.length === 0) return;

    this.overlays.forEach((overlayData) => {
      this._renderSingleOverlay(overlayData);
    });
  }

  /**
   * 渲染单个overlay
   * @param {Object} overlayData - overlay数据
   * @private
   */
  _renderSingleOverlay(overlayData) {
    if (!this.tracksContainer) return;

    const { id, index, startDate, startTime, endDate, endTime, color, opacity, zIndex } =
      overlayData;
    const currentDateStr = this.date.toISOString().split('T')[0];

    // 获取对应轨道
    const track = this.tracksContainer.children[index];
    if (!track) {
      console.warn(`_renderSingleOverlay: 轨道索引 ${index} 不存在`);
      return;
    }

    // 获取轨道内的slider容器
    const sliderContainer = track.querySelector(
      `.${this.flag}-ihm-timeSlider-trackContainer-trackRow-slider`,
    );
    if (!sliderContainer) return;

    // 移除已存在的同ID overlay
    const existingOverlay = sliderContainer.querySelector(`[data-overlay-id="${id}"]`);
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // 计算当前日期下overlay的显示范围
    const overlayRange = this._calculateOverlayRange(
      currentDateStr,
      startDate,
      startTime,
      endDate,
      endTime,
    );

    if (!overlayRange) return; // 当前日期不在overlay范围内

    const { startSeconds, endSeconds } = overlayRange;

    // 计算位置和宽度
    const leftPosition = (startSeconds * this.scaleWidth) / this.scaleSeconds;
    const width = ((endSeconds - startSeconds) * this.scaleWidth) / this.scaleSeconds;

    if (width <= 0) return;

    // 创建overlay元素
    const overlayElement = createElement('div', `${this.flag}-ihm-timeSlider-overlay`, {
      position: 'absolute',
      top: '0',
      left: `${leftPosition}px`,
      width: `${width}px`,
      height: '100%',
      backgroundColor: color,
      opacity: opacity,
      zIndex: zIndex,
      pointerEvents: 'none', // 不阻挡事件
    });

    overlayElement.setAttribute('data-overlay-id', id);
    sliderContainer.appendChild(overlayElement);
  }

  /**
   * 计算overlay在当前日期的显示范围
   * @param {string} currentDateStr - 当前日期字符串
   * @param {string} startDate - 开始日期
   * @param {string} startTime - 开始时间
   * @param {string} endDate - 结束日期
   * @param {string} endTime - 结束时间
   * @returns {Object|null} - {startSeconds, endSeconds} 或 null
   * @private
   */
  _calculateOverlayRange(currentDateStr, startDate, startTime, endDate, endTime) {
    // 将日期转换为时间戳进行比较
    const currentDate = new Date(currentDateStr).getTime();
    const overlayStartDate = new Date(startDate).getTime();
    const overlayEndDate = new Date(endDate).getTime();

    // 检查当前日期是否在overlay范围内
    if (currentDate < overlayStartDate || currentDate > overlayEndDate) {
      return null; // 当前日期不在范围内
    }

    let startSeconds, endSeconds;

    // 计算开始秒数
    if (currentDateStr === startDate) {
      // 当前日期是开始日期，使用指定的开始时间
      startSeconds = parseTimeToSeconds(startTime);
    } else {
      // 当前日期在开始日期之后，从00:00:00开始
      startSeconds = 0;
    }

    // 计算结束秒数
    if (currentDateStr === endDate) {
      // 当前日期是结束日期，使用指定的结束时间
      endSeconds = parseTimeToSeconds(endTime);
    } else {
      // 当前日期在结束日期之前，到24:00:00结束
      endSeconds = 86400; // 24小时
    }

    return { startSeconds, endSeconds };
  }

  // 监听窗口变化
  _addResizeListener() {
    this.resizeObserver = new ResizeObserver((entries) => {
      // 当容器大小变化时重新计算尺寸并更新UI
      this.timelineWidth = this.container.offsetWidth - this.padding.left - this.padding.right - 2;
      this.timelineHeight = this.container.offsetHeight - this.padding.top - this.padding.bottom;
      this.render();
    });

    this.resizeObserver.observe(this.container);
  }

  // 销毁
  destroy() {
    // 清理所有的定时器/动画帧
    if (this.tracksContainer) {
      for (let i = 0; i < this.tracksContainer.children.length; i++) {
        const track = this.tracksContainer.children[i];
        if (track.markerLine) {
          // 清除定时器
          if (track.markerLine.movementInterval) {
            clearInterval(track.markerLine.movementInterval);
            track.markerLine.movementInterval = null;
          }

          // 清除动画帧
          if (track.markerLine.animationFrameId) {
            cancelAnimationFrame(track.markerLine.animationFrameId);
            track.markerLine.animationFrameId = null;
          }
        }
      }
    }

    // 移除事件监听器
    const downloadBtns = this.container.querySelectorAll(
      `.${this.flag}-ihm-timeSlider-download-btn`,
    );
    downloadBtns.forEach((btn) => {
      btn.removeEventListener('click', this.onDownloadClick);
    });

    // 移除resize观察器
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // 清空容器
    this.container.innerHTML = '';

    // 清空引用
    this.tracksContainer = null;
    this.timeIndicatorText = null;
    this.markerLineInfo = [];
    this.markerLineStates = {};
    this.trackGlobalStates = {}; // 清空轨道全局状态
    this.overlays = []; // 清空overlay数据
  }
}
