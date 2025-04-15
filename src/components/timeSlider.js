import { _styles } from "../common/variable.js";
import { createElement, isDom, adjustDate } from "../utils/common.js";
import { calculateTimeFromPosition } from "../utils/auxiliary.js";
import { emptySVG } from "../common/svg.js";
import { createTopBar } from "./TimeTopBar.js";
import { createTracks } from "./TimeTrack.js";
import { startMarkerMovement, stopMarkLine, resumeMarkLine } from "../utils/markLine.js";

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
    this.theme = config.theme || "light-theme";
    // 一些有关宽度的样式
    this.styles = config.styles || {};
    this.version = "v202501151711_IHM_TIMESLIDER";
    this.flag = config.flag || "__4f8fbfb";

    this.container = config.container;
    this.date = new Date(config.curDay || new Date().toISOString().split("T")[0]); // 当前显示的日期
    this.data = config.data; // 录像数据

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
    this.markerLineInstance = {}; // 存储刻度线的实例，不会经常变化

    this.render();
    this._addResizeListener();
  }

  // 主渲染方法
  render() {
    // 清空容器
    this.container.innerHTML = "";

    // 创建时间轴容器
    const mainContainer = createElement("div", `${this.flag}-ihm-timeSlider-mainContainer`, {
      position: "relative",
      paddingLeft: `${this.padding.left}px`,
      paddingRight: `${this.padding.right}px`,
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
      onZoomInClick: () => this.adjustTimeLine("in"),
      onZoomOutClick: () => this.adjustTimeLine("out"),
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
      timelineContainer: topbarContainer.querySelector(`.${this.flag}-ihm-timeSlider-topbarContainer-scaleAxis`),
      markerLineInfo: this.markerLineInfo,
      onDownloadClick: this.onDownloadClick,
      onSegmentDblClick: this.onSegmentDblClick,
    };

    this.tracksContainer = createTracks(tracksConfig);

    // 添加录像轨道
    mainContainer.appendChild(this.tracksContainer);
    this.container.appendChild(mainContainer);

    // 触发日期变更回调
    if (this.onDateChange) {
      this.onDateChange(this.date.toISOString().split("T")[0]);
    }
  }

  // 显示时间选择器
  showTimeSelector() {
    const dateStr = this.date.toISOString().split("T")[0];
    const newDateStr = prompt("请输入日期 (YYYY-MM-DD)", dateStr);
    if (newDateStr && /^\d{4}-\d{2}-\d{2}$/.test(newDateStr)) {
      this.date = new Date(newDateStr);
      this.render();
    }
  }

  // 切换到前一天
  prevDay() {
    this.date = adjustDate(this.date, "prev");
    this.render();
  }

  // 切换到后一天
  nextDay() {
    this.date = adjustDate(this.date, "next");
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

    // 保存标记线信息
    this.markerLineInfo = [];
    if (this.tracksContainer) {
      for (let i = 0; i < this.tracksContainer.children.length; i++) {
        const track = this.tracksContainer.children[i];
        if (track.markerLine) {
          this.markerLineInfo.push(track.markerLine.info);
        }
      }
    }

    if (direction === "in" && currentIndex < scales.length - 1) {
      // 放大：切换到下一个更大的刻度
      this.scaleTime = scales[currentIndex + 1];
      this.scaleSeconds = this.scaleMap[this.scaleTime]; // 获取新的刻度秒数
      this.render();
    } else if (direction === "out" && currentIndex > 0) {
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
    if (theme !== "light-theme" && theme !== "dark-theme") return;
    this.theme = theme;
    this.render();
  }

  // 停止刻度线移动
  stopMarkLine(trackIndex) {
    stopMarkLine(this.tracksContainer, trackIndex);
  }

  // 恢复刻度线移动
  resumeMarkLine(trackIndex) {
    resumeMarkLine(this.tracksContainer, trackIndex);
  }

  // 获取时间轴的信息
  getInfo() {
    const info = {
      date: this.date.toISOString().split("T")[0], // 当前显示的日期
      tracks: [],
      scaleTime: this.scaleTime,
      scaleSeconds: this.scaleSeconds,
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
        const currentTime = calculateTimeFromPosition(markerLeft, this.scaleWidth, this.scaleSeconds);

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
    const downloadBtns = this.container.querySelectorAll(`.${this.flag}-ihm-timeSlider-download-btn`);
    downloadBtns.forEach((btn) => {
      btn.removeEventListener("click", this.onDownloadClick);
    });

    // 移除resize观察器
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // 清空容器
    this.container.innerHTML = "";

    // 清空引用
    this.tracksContainer = null;
    this.timeIndicatorText = null;
    this.markerLineInfo = [];
    this.markerLineInstance = {};
  }
}
