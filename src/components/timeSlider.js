import { _styles } from "../common/variable.js";
import { createElement, createScale, createTimeBlocks, isDom, customStyle } from "../utils/common.js";
import { calculateTimeFromPosition, calculatePositionFromTime } from "../utils/auxiliary.js";
import { plusSVG, prevDaySVG, nextDaySVG, minusSVG, downloadSVG, emptySVG } from "../common/svg.js";
import { __styles_emptyContainer, __styles_leftInfoContainer } from "../common/styles.js";

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
  }

  // 主渲染方法
  render() {
    // 清空容器
    this.container.innerHTML = "";

    const currentDateStr = this.date.toISOString().split("T")[0];
    const recordingsPerTrack = this.data.map((data) => data[currentDateStr] || []);
    const extInfoArr = this.data.map((data) => data.extInfo || {});

    // console.log("recordingsPerTrack", recordingsPerTrack);
    // console.log("extInfoArr", extInfoArr);

    // 创建时间轴容器
    const mainContainer = createElement("div", `${this.flag}-ihm-timeSlider-mainContainer`, {
      position: "relative",
      paddingLeft: `${this.padding.left}px`,
      paddingRight: `${this.padding.right}px`,
    });

    // 添加顶部
    mainContainer.appendChild(this.renderTopbar());
    // 添加录像轨道
    mainContainer.appendChild(this.renderTracks(recordingsPerTrack, extInfoArr));

    this.container.appendChild(mainContainer);

    // 触发日期变更回调
    if (this.onDateChange) {
      this.onDateChange(currentDateStr);
    }

    // 绑定事件
    this.bindingEvents();
  }

  // 创建时间刻度
  renderTopbar() {
    const topbarContainer = createElement("div", `${this.flag}-ihm-timeSlider-topbarContainer`, {
      position: "relative",
      height: customStyle(this.styles.headerHeight, "30px"),
      border: `1px solid ${_styles[this.theme].borderColor}`,
      borderBottom: "none",
      display: "flex",
    });

    // 左侧的时间和4个按钮
    const timeAndButtonContainer = createElement("div", `${this.flag}-ihm-timeSlider-topbarContainer-info`, {
      position: "relative",
      width: "160px",
      minWidth: "160px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      borderRight: `1px solid ${_styles[this.theme].borderColor}`,
    });

    timeAndButtonContainer.innerHTML = `
      ${plusSVG(this.flag, this.styles, this.theme)}
      ${prevDaySVG(this.flag, this.styles, this.theme)}
      <span style="font-size: 14px; color: ${_styles[this.theme].leftTextColor};">${this.date.toISOString().split("T")[0]}</span>
      ${nextDaySVG(this.flag, this.styles, this.theme)}
      ${minusSVG(this.flag, this.styles, this.theme)}
    `;
    topbarContainer.appendChild(timeAndButtonContainer);

    // 外部容器
    const dragContainer = createElement("div", `${this.flag}-ihm-timeSlider-topbarContainer-dragContainer`, {
      position: "relative",
      overflow: "hidden", // 隐藏超出的内容
      flexGrow: 1,
      height: "100%",
    });

    const timelineContainer = createElement("div", `${this.flag}-ihm-timeSlider-topbarContainer-scaleAxis`, {
      position: "absolute",
      display: "flex",
      alignItems: "center",
      height: "100%",
      left: "0",
      top: "0",
    });

    const scaleArr = createScale(this.scaleTime, this.scaleSeconds);

    // console.log("scaleArr", scaleArr);

    for (let i = 0; i <= this.scaleTime; i++) {
      let x = (1 / this.scaleTime) * (this.timelineWidth - 160);
      if (x > 50) {
        this.scaleWidth = x;
      } else {
        x = this.scaleWidth;
      }

      const scaleBlock = createElement("div", `${this.flag}-ihm-timeSlider-topbarContainer-scaleAxis-axisBlock`, {
        position: "relative",
        display: "flex",
        alignItems: "center",
        // 如果是最后一个宽度为1
        width: i === this.scaleTime ? "1px" : `${x}px`,
        height: "100%",
        backgroundColor: _styles[this.theme].headerBackgroundColor,
        color: _styles[this.theme].headerTextColor,
        fontSize: customStyle(this.styles.headerFontSize, "11px"),
      });

      // 根据条件设置 margin-left
      const marginLeft =
        i === 0
          ? customStyle(this.styles.headerFirstTextMargin, "0px")
          : i === this.scaleTime
          ? customStyle(this.styles.headerLastTextMargin, "-30px")
          : customStyle(this.styles.headerNormalTextMargin, "-15px");

      scaleBlock.innerHTML = `
        <span class="${
          this.flag
        }-ihm-timeSlider-topbarContainer-scaleAxis-axisBlock-span" style="user-select: none; margin-left: ${marginLeft};">${scaleArr[i].slice(
        0,
        5
      )}</span>
        <div class="${this.flag}-ihm-timeSlider-topbarContainer-scaleAxis-axisBlock-axis" style="width: ${customStyle(
        this.styles.headerFontSize,
        "1px"
      )}; height: ${customStyle(this.styles.headerFontSize, "4px")}; background-color: ${
        _styles[this.theme].headerAxisColor
      }; position: absolute; left: 0; bottom: 0;"></div>
      `;

      timelineContainer.appendChild(scaleBlock);
    }

    dragContainer.appendChild(timelineContainer);
    topbarContainer.appendChild(dragContainer);
    // 调用拖拽绑定逻辑
    this.bindDragEvents(dragContainer, timelineContainer);

    return topbarContainer;
  }

  // 创建录像轨道
  renderTracks(recordingsPerTrack, extInfoArr) {
    // 防止内存泄漏
    if (this.tracksContainer) {
      for (let i = 0; i < this.tracksContainer.children.length; i++) {
        const track = this.tracksContainer.children[i];
        if (track.markerLine && track.markerLine.movementInterval) {
          clearInterval(track.markerLine.movementInterval);
          track.markerLine.movementInterval = null;
        }
      }
    }

    this.tracksContainer = createElement("div", `${this.flag}-ihm-timeSlider-trackContainer`, {
      position: "relative",
      maxHeight: customStyle(this.styles.scrollHeight, "none"),
      overflow: "auto",
    });

    // 如果没有数据，显示空状态
    if (!recordingsPerTrack || recordingsPerTrack.length === 0) {
      const emptyContainer = createElement("div", `${this.flag}-ihm-timeSlider-empty`, __styles_emptyContainer(this.flag, this.styles, this.theme));

      emptyContainer.innerHTML = `${emptySVG(this.flag, this.styles, this.theme)}`;

      this.tracksContainer.appendChild(emptyContainer);
      return this.tracksContainer;
    }

    recordingsPerTrack.forEach((recordings, trackIndex) => {
      // console.log("trackIndex", trackIndex);
      const isLastTrack = trackIndex === recordingsPerTrack.length - 1;
      const trackRow = createElement("div", `${this.flag}-ihm-timeSlider-trackContainer-trackRow`, {
        position: "relative",
        flexGrow: "1",
        height: `${this.trackHeight}px`,
        border: `1px solid ${_styles[this.theme].borderColor}`,
        borderBottom: isLastTrack ? `1px solid ${_styles[this.theme].borderColor}` : "none",
        display: "flex",
        backgroundColor: _styles[this.theme].trackBackgroundColor,
      });
      const infoContainer = createElement(
        "div",
        `${this.flag}-ihm-timeSlider-trackContainer-trackRow-info`,
        __styles_leftInfoContainer(this.flag, this.styles, this.theme)
      );
      infoContainer.innerHTML = `
        <div class="" style="width: 100%; display: flex; align-items: center; justify-content: space-between;">
          <div style="flex: 1; display: flex; justify-content: center;">
            <span style="font-size: 14px; color: ${
              _styles[this.theme].leftTextColor
            }; max-width: calc(100% - 30px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${extInfoArr[trackIndex].name}</span>
          </div>
          <span class="${
            this.flag
          }-ihm-timeSlider-download-btn" style="width: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer">${downloadSVG(
        this.flag,
        this.styles,
        this.theme
      )}</span>
        </div>
      `;

      const downloadBtn = infoContainer.querySelector(`.${this.flag}-ihm-timeSlider-download-btn`);
      if (downloadBtn) {
        downloadBtn.addEventListener("click", (event) => {
          if (this.onDownloadClick) {
            this.onDownloadClick({
              info: extInfoArr[trackIndex],
              event,
            });
          }
        });
      }

      trackRow.appendChild(infoContainer);

      // 外部拖拽容器
      const dragContainer = createElement("div", `${this.flag}-ihm-timeSlider-trackContainer-dragContainer`, {
        position: "relative",
        overflow: "hidden", // 隐藏超出的内容
        flexGrow: 1,
        height: "100%",
      });

      const sliderContainer = createElement("div", `${this.flag}-ihm-timeSlider-trackContainer-trackRow-slider`, {
        position: "absolute",
        display: "flex",
        alignItems: "center",
        height: "100%",
        left: "0",
        top: "0",
      });

      // 在 renderTracks 中，为每个轨道添加刻度线
      const markerLine = createElement("div", `${this.flag}-ihm-timeSlider-markerLine`, {
        position: "absolute",
        top: "0",
        left: "0", // 初始位置
        width: customStyle(this.styles.markerLineWidth, "1px"),
        height: "100%",
        zIndex: 2025, // 确保在滑块上层
        pointerEvents: "none", // 防止事件阻挡
        backgroundColor: _styles[this.theme].markerLineColor,
      });

      sliderContainer.appendChild(markerLine);
      // 保存刻度线引用到每个轨道
      trackRow.markerLine = markerLine;

      // 重置刻度线的位置并启动移动
      if (this.markerLineInfo.length !== 0) {
        const info = this.markerLineInfo[trackIndex];
        // console.log("info", info);

        if (info) {
          const { time: infoTime, criticalTime: infoCriticalTime } = info;
          const newLeft = calculatePositionFromTime(infoTime, this.scaleWidth, this.scaleSeconds);
          const markerLine = trackRow.markerLine;
          const newCritical = calculatePositionFromTime(infoCriticalTime, this.scaleWidth, this.scaleSeconds);

          markerLine.style.left = `${newLeft}px`;

          // 启动刻度线的移动
          this.startMarkerMovement(markerLine, newCritical, infoCriticalTime);
        }
      }

      // 渲染时间块
      const recordingsExtInfo = extInfoArr[trackIndex];
      const timeBlocks = createTimeBlocks(recordings, recordingsExtInfo, this.scaleWidth, this.scaleSeconds, this.theme);

      timeBlocks.forEach((block) => {
        const recordingSegment = createElement("div", `${this.flag}-ihm-timeSlider-trackContainer-trackRow-slider-block`, {
          height: "100%",
          width: `${block.width}px`,
          backgroundColor: `${block.color}`,
        });

        const themeBlockColor = this.theme === "dark-theme" ? "#626773" : "#dbdee7";

        // 只有蓝色的滑块需要绑定绑定事件
        if (block.color === themeBlockColor) {
          recordingSegment.addEventListener("dblclick", (event) => {
            // 滑块容器距离左侧的距离
            const container_left = sliderContainer.getBoundingClientRect().left;
            // 鼠标点击距离左侧的距离
            const click_left = event.clientX;
            // 蓝色滑块距离左侧的距离 这里并不需要取拖拽的left，因为拖拽后相应的滑块容器距离也会减少
            const block_left = click_left - container_left;

            let time = calculateTimeFromPosition(block_left, this.scaleWidth, this.scaleSeconds);

            const timeObj = {
              // 2025-03-20
              day: new Date(this.date).toISOString().split("T")[0],
              // 2025-03-21
              nextDay: new Date(new Date(this.date).setDate(new Date(this.date).getDate() + 1)).toISOString().split("T")[0],
              // 2025-03-20 15:00
              time: this.date.toISOString().split("T")[0] + " " + time,
              // 2025-03-21 15:00
              nextTime: new Date(new Date(this.date).setDate(new Date(this.date).getDate() + 1)).toISOString().split("T")[0] + " " + time,
            };

            // console.log("对应时间", time);

            // 获取当前轨道的刻度线，并移动到点击位置
            const markerLine = trackRow.markerLine;
            markerLine.style.left = `${block_left}px`;

            // 计算临界宽度
            const { width: blueBlock_width, left: blueBlock_left } = recordingSegment.getBoundingClientRect();
            const critical = blueBlock_width + blueBlock_left - container_left;
            const criticalTime = block.end;

            // 启动刻度线的移动
            this.startMarkerMovement(markerLine, critical, criticalTime);

            // 触发双击事件回调
            if (this.onSegmentDblClick) {
              this.onSegmentDblClick({ ...timeObj, info: block.extInfo, event });
            }
          });
        }

        sliderContainer.appendChild(recordingSegment);
      });

      dragContainer.appendChild(sliderContainer);
      this.bindHoverEvents(sliderContainer);
      trackRow.appendChild(dragContainer);
      this.tracksContainer.appendChild(trackRow);
    });

    return this.tracksContainer;
  }

  // 刻度线开始移动
  startMarkerMovement(markerLine, critical, criticalTime) {
    // 清除已有的定时器，防止重复启动（虽然我在前面已经清理过了）
    if (markerLine.movementInterval) {
      clearInterval(markerLine.movementInterval);
      markerLine.movementInterval = null;
    }

    // 计算每秒钟应移动的像素
    const pixelsPerSecond = this.scaleWidth / this.scaleSeconds; // 每秒钟移动的像素

    const executeMovement = () => {
      // 如果有暂停就不执行
      const isPaused = markerLine.isPaused;
      if (isPaused) return;

      const currentLeft = parseFloat(markerLine.style.left) || 0;
      const newLeft = currentLeft + pixelsPerSecond; // 每秒移动对应的像素

      if (newLeft >= critical) {
        // 到达临界点，停止移动
        clearInterval(markerLine.movementInterval);
        markerLine.movementInterval = null;
        markerLine.style.left = `${critical}px`;

        const time = calculateTimeFromPosition(critical, this.scaleWidth, this.scaleSeconds);
        markerLine.info = {
          time,
          criticalTime,
        };
        // console.log("Reached end of track", time);
      } else {
        markerLine.style.left = `${newLeft}px`;
        const time = calculateTimeFromPosition(newLeft, this.scaleWidth, this.scaleSeconds);
        markerLine.info = {
          time,
          criticalTime,
        };
        // console.log("time", time);
      }
    };
    // 立即执行一次
    executeMovement();
    // 每秒执行一次
    markerLine.movementInterval = setInterval(executeMovement, 1000);
  }

  // 刻度线停止移动
  stopMarkLine(trackIndex) {
    if (!this.tracksContainer || !this.tracksContainer.children) return;

    // 如果没有指定索引，则停止所有轨道的刻度线
    if (trackIndex === undefined) {
      for (let i = 0; i < this.tracksContainer.children.length; i++) {
        const track = this.tracksContainer.children[i];
        if (track.markerLine) {
          track.markerLine.isPaused = true;
        }
      }
      return;
    }

    // 获取指定索引的轨道
    const track = this.tracksContainer.children[trackIndex];
    if (track && track.markerLine) {
      track.markerLine.isPaused = true;
    }
  }

  // 刻度线恢复移动
  resumeMarkLine(trackIndex) {
    if (!this.tracksContainer || !this.tracksContainer.children) return;

    // 如果没有指定索引，则启动所有轨道的刻度线
    if (trackIndex === undefined) {
      for (let i = 0; i < this.tracksContainer.children.length; i++) {
        const track = this.tracksContainer.children[i];
        if (track.markerLine) {
          track.markerLine.isPaused = false;
        }
      }
      return;
    }

    // 获取指定索引的轨道
    const track = this.tracksContainer.children[trackIndex];
    if (track && track.markerLine) {
      track.markerLine.isPaused = false;
    }
  }

  // 绑定事件
  bindingEvents() {
    const eventMap = [
      { selector: ".ihm-timeSlider-plus-svg", handler: () => this.adjustTimeLine("in") },
      { selector: ".ihm-timeSlider-prev-svg", handler: () => this.prevDay() },
      { selector: ".ihm-timeSlider-next-svg", handler: () => this.nextDay() },
      { selector: ".ihm-timeSlider-minus-svg", handler: () => this.adjustTimeLine("out") },
    ];

    eventMap.forEach(({ selector, handler }) => {
      const element = this.container.querySelector(selector);
      if (element) {
        element.addEventListener("click", handler);
      }
    });
  }

  // 拖拽绑定
  bindDragEvents(dragContainer, timelineContainer) {
    let isDragging = false;
    let startX = 0;
    let currentLeft = 0;
    let velocity = 0;
    let lastDeltaX = 0;

    const syncSliderPositions = () => {
      // 找到页面中所有classname为 "ihm-timeSlider-trackContainer-trackRow-slider" 的元素
      const sliders = document.querySelectorAll(".ihm-timeSlider-trackContainer-trackRow-slider");
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
      "wheel",
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

    dragContainer.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
      lastDeltaX = 0;
      dragContainer.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
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

    document.addEventListener("mouseup", () => {
      if (!isDragging) return;

      isDragging = false;
      requestAnimationFrame(updatePosition); // 开始惯性滑动
      dragContainer.style.cursor = "default";
    });
  }

  // 绑定轨道hover事件
  bindHoverEvents(sliderContainer) {
    // 创建并添加时间指示线
    const timeIndicatorLine = createElement("div", "ihm-timeSlider-timeMarker", {
      position: "absolute",
      top: "0",
      left: "-9999px", // 初始隐藏
      width: customStyle(this.styles.markerLineHoverWidth, "1px"),
      height: "100%",
      zIndex: 2025,
      pointerEvents: "none",
      backgroundColor: _styles[this.theme].markerLineHoverColor,
    });
    sliderContainer.appendChild(timeIndicatorLine);

    sliderContainer.addEventListener("mousemove", (event) => {
      const container_left = sliderContainer.getBoundingClientRect().left;
      const click_left = event.clientX;
      const line_left = click_left - container_left;

      // 根据鼠标位置计算当前时间
      const time = calculateTimeFromPosition(line_left, this.scaleWidth, this.scaleSeconds);

      // 更新时间指示线位置
      timeIndicatorLine.style.left = `${line_left}px`;

      // 更新时间显示
      this.updateTimeDisplay(time, line_left);
    });

    sliderContainer.addEventListener("mouseleave", () => {
      timeIndicatorLine.style.left = "-9999px"; // 隐藏时间指示线
      this.timeIndicatorText.style.left = "-9999px"; // 隐藏时间显示
    });
  }

  // 更新时间显示
  updateTimeDisplay(time, line_left) {
    this.timeIndicatorText = document.querySelector(`.${this.flag}-ihm-timeSlider-timeDisplay`);

    if (!this.timeIndicatorText) {
      this.timeIndicatorText = createElement("div", `${this.flag}-ihm-timeSlider-timeDisplay`, {
        position: "absolute",
        top: "0",
        left: `${line_left - 18}px`,
        color: "fff",
        fontSize: "10px",
      });
      // 添加到class为ihm-timeSlider-topbarContainer-dragContainer的元素中
      const timelineContainer = this.container.querySelector(`.${this.flag}-ihm-timeSlider-topbarContainer-scaleAxis`);
      timelineContainer.appendChild(this.timeIndicatorText);
    } else {
      this.timeIndicatorText.style.left = `${line_left - 18}px`;
    }

    this.timeIndicatorText.textContent = time;
  }

  // 切换到前一天
  prevDay() {
    // console.log("prevDay");
    this.date.setDate(this.date.getDate() - 1);
    this.render();
  }

  // 切换到后一天
  nextDay() {
    // console.log("nextDay");
    this.date.setDate(this.date.getDate() + 1);
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
      // console.log("Zoomed In:", this.scaleTime, this.scaleSeconds);
      this.render();
    } else if (direction === "out" && currentIndex > 0) {
      // 缩小：切换到上一个更小的刻度
      this.scaleTime = scales[currentIndex - 1];
      this.scaleSeconds = this.scaleMap[this.scaleTime]; // 获取新的刻度秒数
      // console.log("Zoomed Out:", this.scaleTime, this.scaleSeconds);
      this.render();
    } else {
      // console.log(`Already at ${direction === "in" ? "maximum" : "minimum"} zoom level`);
    }
  }

  // 设置日期变更回调
  setDateChangeCallback(callback) {
    this.onDateChange = callback;
  }

  // 修改模式: 亮色模式 / 暗色模式
  setTheme(theme) {
    // console.log("theme", theme);
    // 先替换主题变量
    if (theme !== "light-theme" && theme !== "dark-theme") return;
    this.theme = theme;

    // 更新所有使用主题颜色的元素
    const mainContainer = this.container.querySelector(`.${this.flag}-ihm-timeSlider-mainContainer`);

    // console.log("this.container", this.container);
    // console.log("mainContainer", mainContainer);
    if (!mainContainer) return;

    // 更新顶部容器边框
    const topbarContainer = mainContainer.querySelector(`.${this.flag}-ihm-timeSlider-topbarContainer`);
    if (topbarContainer) {
      topbarContainer.style.border = `1px solid ${_styles[theme].borderColor}`;
      topbarContainer.style.borderBottom = "none"; // 保持底部边框为空
    }

    // 更新左侧信息容器边框
    const timeAndButtonContainer = mainContainer.querySelector(`.${this.flag}-ihm-timeSlider-topbarContainer-info`);
    if (timeAndButtonContainer) {
      timeAndButtonContainer.style.borderRight = `1px solid ${_styles[theme].borderColor}`;
    }

    // 更新日期文本颜色
    const dateText = timeAndButtonContainer && timeAndButtonContainer.querySelector("span");
    if (dateText) {
      dateText.style.color = _styles[theme].leftTextColor;
    }

    // 更新轨道容器边框
    const trackRows = mainContainer.querySelectorAll(`.${this.flag}-ihm-timeSlider-trackContainer-trackRow`);
    trackRows.forEach((row, index) => {
      const isLastTrack = index === trackRows.length - 1;
      row.style.border = `1px solid ${_styles[theme].borderColor}`;
      row.style.borderBottom = isLastTrack ? `1px solid ${_styles[theme].borderColor}` : "none";
      row.style.backgroundColor = _styles[theme].trackBackgroundColor;
    });

    // 更新轨道名称左侧信息
    const trackInfo = mainContainer.querySelectorAll(`.${this.flag}-ihm-timeSlider-trackContainer-trackRow-info`);
    trackInfo.forEach((info) => {
      info.style.borderRight = `1px solid ${_styles[theme].borderColor}`;
    });

    // 更新轨道名称左侧信息文本
    const trackNames = mainContainer.querySelectorAll(`.${this.flag}-ihm-timeSlider-trackContainer-trackRow-info span`);
    trackNames.forEach((name) => {
      name.style.color = _styles[theme].leftTextColor;
    });

    // 更新刻度文本和背景颜色
    const scaleBlocks = mainContainer.querySelectorAll(
      `.${this.flag}-ihm-timeSlider-topbarContainer-scaleAxis > .${this.flag}-ihm-timeSlider-topbarContainer-scaleAxis-axisBlock`
    );
    // console.log("scaleBlocks", scaleBlocks);
    scaleBlocks.forEach((block) => {
      block.style.backgroundColor = _styles[theme].headerBackgroundColor;
      block.style.color = _styles[theme].headerTextColor;
      const scaleText = block.querySelector("span");
      if (scaleText) {
        scaleText.style.color = _styles[theme].headerTextColor;
      }
      const scaleAxis = block.querySelector("div");
      if (scaleAxis) {
        scaleAxis.style.backgroundColor = _styles[theme].headerAxisColor;
      }
    });

    // 更新图标颜色
    const svgPaths = mainContainer.querySelectorAll("svg path");
    svgPaths.forEach((path) => {
      path.setAttribute("fill", _styles[theme].iconColor);
    });

    // 更新时间指示线颜色
    // const timeMarkers = mainContainer.querySelectorAll(`.${this.flag}-ihm-timeSlider-timeMarker`);
    // timeMarkers.forEach((marker) => {
    //   marker.style.backgroundColor = _styles[theme].markerLineHoverColor;
    // });

    // 更新时间轴块的背景颜色
    const timeBlocks = mainContainer.querySelectorAll(
      `.${this.flag}-ihm-timeSlider-trackContainer-trackRow-slider > .${this.flag}-ihm-timeSlider-trackContainer-trackRow-slider-block`
    );
    timeBlocks.forEach((block) => {
      const currentBgColor = window.getComputedStyle(block).backgroundColor;
      // 只更新非透明背景的块
      if (currentBgColor !== "transparent" && currentBgColor !== "rgba(0, 0, 0, 0)") {
        block.style.backgroundColor = theme === "dark-theme" ? "#626773" : "#dbdee7";
      }
    });

    // 更新空状态图标
    const emptyContainer = mainContainer.querySelector(`.${this.flag}-ihm-timeSlider-empty`);
    // console.log("emptyContainer", emptyContainer);
    if (emptyContainer) {
      emptyContainer.style.border = `1px solid ${_styles[theme].borderColor}`;
      emptyContainer.innerHTML = emptySVG(this.flag, this.styles, theme);
    }
  }

  // 销毁
  destroy() {
    // 清除容器中的内容
    this.container.innerHTML = "";

    // 清理所有轨道上的刻度线的定时器
    if (this.tracksContainer) {
      for (let i = 0; i < this.tracksContainer.children.length; i++) {
        const track = this.tracksContainer.children[i];
        if (track.markerLine && track.markerLine.movementInterval) {
          clearInterval(track.markerLine.movementInterval);
          track.markerLine.movementInterval = null;
        }
      }
    }

    // 移除事件监听器
    const eventMap = [
      { selector: ".ihm-timeSlider-plus-svg", handler: () => this.adjustTimeLine("in") },
      { selector: ".ihm-timeSlider-prev-svg", handler: () => this.prevDay() },
      { selector: ".ihm-timeSlider-next-svg", handler: () => this.nextDay() },
      { selector: ".ihm-timeSlider-minus-svg", handler: () => this.adjustTimeLine("out") },
    ];
    eventMap.forEach(({ selector, handler }) => {
      const element = this.container.querySelector(selector);
      if (element) {
        element.removeEventListener("click", handler);
      }
    });

    // 清理全局事件监听器
    document.removeEventListener("mousemove", this.mouseMoveHandler);
    document.removeEventListener("mouseup", this.mouseUpHandler);

    // 清空引用，防止内存泄漏
    this.container = null;
    this.tracksContainer = null;
    this.timeIndicatorText = null;
    this.onDateChange = null;
    this.onSegmentDblClick = null;
    this.onSegmentContextMenu = null;
  }
}
