import { createElement, getContainer, createScale, createTimeBlocks, calculateTimeFromPosition, calculatePositionFromTime } from "../utils/common.js";
import { plusSVG, prevDaySVG, nextDaySVG, minusSVG } from "./svg.js";

export default class ihm_TimeSlider {
  constructor(config) {
    this.container = getContainer(config.id);
    this.date = new Date(config.curDay); // 当前显示的日期
    this.data = config.data; // 录像数据

    this.padding = { top: 0, bottom: 0, left: 25, right: 25 };

    this.trackHeight = 25; // 每条轨道的高度
    this.trackGap = 0; // 每条轨道的间隔
    this.timelineWidth = this.container.offsetWidth - this.padding.left - this.padding.right - 2;
    this.timelineHeight = this.container.offsetHeight - this.padding.top - this.padding.bottom;

    // 刻度时间，默认是用小时作为单位，则刻度就会显示00:00, 01:00, 02:00, ... 24:00
    this.scaleTime = 24;
    // 刻度宽度，默认是50px
    this.scaleWidth = 50;
    // 刻度间隔，默认是60分钟
    this.scaleInterval = 60;

    this.scaleMap = {
      24: 60, // 1小时
      48: 30, // 30分钟
      288: 5, // 5分钟
      1440: 1, // 1分钟
    };

    this.onDateChange = null; // 日期变更回调
    this.onSegmentDblClick = config.dbClick || null; // 双击事件回调
    this.onSegmentContextMenu = config.rtClick || null; // 右键事件回调

    this.tracksContainer = null; // 轨道容器

    this.tracksInfoArr = [];

    this.render();
  }

  // 主渲染方法
  render() {
    // 清空容器
    this.container.innerHTML = "";

    const currentDateStr = this.date.toISOString().split("T")[0];
    const recordingsPerTrack = this.data.map((trackData) => trackData[currentDateStr] || []);
    const totalTracks = recordingsPerTrack.length;

    // 创建时间轴容器
    const mainContainer = createElement("div", "ihm-timeSlider-mainContainer", {
      position: "relative",
      paddingLeft: `${this.padding.left}px`,
      paddingRight: `${this.padding.right}px`,
    });

    // 添加顶部
    mainContainer.appendChild(this.renderTopbar());
    // 添加录像轨道
    mainContainer.appendChild(this.renderTracks(recordingsPerTrack, totalTracks));

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
    const topbarContainer = createElement("div", "ihm-timeSlider-topbarContainer", {
      position: "relative",
      height: "30px",
      border: "1px solid #ccc",
      borderBottom: "none",
      display: "flex",
    });

    const infoContainer = createElement("div", "ihm-timeSlider-topbarContainer-info", {
      position: "relative",
      width: "160px",
      minWidth: "160px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      borderRight: "1px solid #ccc",
    });

    infoContainer.innerHTML = `
      ${plusSVG()}
      ${prevDaySVG(() => this.prevDay())}
      <span style="font-size: 14px; color: #fff;">${this.date.toLocaleDateString()}</span>
      ${nextDaySVG()}
      ${minusSVG()}
    `;
    topbarContainer.appendChild(infoContainer);

    // 外部容器
    const dragContainer = createElement("div", "ihm-timeSlider-topbarContainer-dragContainer", {
      position: "relative",
      overflow: "hidden", // 隐藏超出的内容
      flexGrow: 1,
      height: "100%",
    });

    const timelineContainer = createElement("div", "ihm-timeSlider-topbarContainer-timeline", {
      position: "absolute",
      display: "flex",
      alignItems: "center",
      height: "100%",
      left: "0",
      top: "0",
    });

    const scaleArr = createScale(this.scaleTime, this.scaleInterval);

    // console.log("scaleArr", scaleArr);

    for (let i = 0; i <= this.scaleTime; i++) {
      let x = (1 / this.scaleTime) * (this.timelineWidth - 160);
      if (x > 50) {
        this.scaleWidth = x;
      } else {
        x = this.scaleWidth;
      }

      const scaleBlock = createElement("div", "", {
        position: "relative",
        display: "flex",
        alignItems: "center",
        // 如果是最后一个宽度为1
        width: i === this.scaleTime ? "1px" : `${x}px`,
        height: "100%",
        backgroundColor: "red",
        color: "#fff",
        fontSize: "12px",
      });

      // 根据条件设置 margin-left
      const marginLeft = i === 0 ? 0 : i === this.scaleTime ? -28 : -15;

      scaleBlock.innerHTML = `
        <span style="user-select: none; margin-left: ${marginLeft}px;">${scaleArr[i]}</span>
        <div style="width: 1px; height: 4px; background-color: #fff; position: absolute; left: 0; bottom: 0;"></div>
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
  renderTracks(recordingsPerTrack, totalTracks) {
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

    this.tracksContainer = createElement("div", "ihm-timeSlider-trackContainer", {
      position: "relative",
    });

    recordingsPerTrack.forEach((recordings, trackIndex) => {
      const isLastTrack = trackIndex === totalTracks - 1;
      const trackRow = createElement("div", "ihm-timeSlider-trackContainer-trackRow", {
        position: "relative",
        flexGrow: "1",
        height: `${this.trackHeight}px`,
        border: "1px solid #ccc",
        borderBottom: isLastTrack ? "1px solid #ccc" : "none",
        display: "flex",
      });

      const infoContainer = createElement("div", "ihm-timeSlider-trackContainer-trackRow-info", {
        width: "160px",
        minWidth: "160px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 10px",
        borderRight: "1px solid #ccc",
      });
      infoContainer.innerHTML = `
        <span style="font-size: 14px; color: #fff;">窗口${trackIndex + 1}</span>
      `;
      trackRow.appendChild(infoContainer);

      // 外部拖拽容器
      const dragContainer = createElement("div", "ihm-timeSlider-trackContainer-dragContainer", {
        position: "relative",
        overflow: "hidden", // 隐藏超出的内容
        flexGrow: 1,
        height: "100%",
      });

      const sliderContainer = createElement("div", "ihm-timeSlider-trackContainer-trackRow-slider", {
        position: "absolute",
        display: "flex",
        alignItems: "center",
        height: "100%",
        left: "0",
        top: "0",
      });

      // 在 renderTracks 中，为每个轨道添加黄色刻度线
      const markerLine = createElement("div", "ihm-timeSlider-markerLine", {
        position: "absolute",
        height: "100%",
        width: "2px",
        backgroundColor: "yellow",
        left: "0", // 初始位置
        top: "0",
        zIndex: "2", // 确保在滑块上层
        pointerEvents: "none", // 防止事件阻挡
      });

      sliderContainer.appendChild(markerLine);
      // 保存黄色刻度线引用到每个轨道
      trackRow.markerLine = markerLine;

      console.log("sliderContainer", sliderContainer);
      if (this.tracksInfoArr.length !== 0) {
        const info = this.tracksInfoArr[trackIndex];
        console.log("info", info);

        if (info) {
          const { time: infoTime, criticalTime: infoCriticalTime } = info;
          const newLeft = calculatePositionFromTime(infoTime, this.scaleWidth, this.scaleInterval);
          const markerLine = trackRow.markerLine;
          const newCritical = calculatePositionFromTime(infoCriticalTime, this.scaleWidth, this.scaleInterval);

          markerLine.style.left = `${newLeft}px`;

          // 启动黄色刻度线的移动
          this.startMarkerMovement(markerLine, newCritical);
        }
      }

      const timeBlocks = createTimeBlocks(recordings, this.scaleWidth, this.scaleInterval);

      timeBlocks.forEach((block) => {
        // console.log("block", block);
        const recordingSegment = createElement("div", null, {
          height: "100%",
          width: `${block.width}px`,
          backgroundColor: `${block.color}`,
        });

        // 只有蓝色的滑块需要绑定绑定事件
        if (block.color === "blue") {
          recordingSegment.addEventListener("dblclick", (event) => {
            // 滑块容器距离左侧的距离
            const container_left = sliderContainer.getBoundingClientRect().left;
            // 鼠标点击距离左侧的距离
            const click_left = event.clientX;
            // 蓝色滑块距离左侧的距离 这里并不需要取拖拽的left，因为拖拽后相应的滑块容器距离也会减少
            const block_left = click_left - container_left;

            // console.log("container_left", container_left);
            // console.log("click_left", click_left);
            // console.log("block_left", block_left);

            const time = calculateTimeFromPosition(block_left, this.scaleWidth, this.scaleInterval);

            console.log("对应时间", time);

            // 获取当前轨道的黄色刻度线，并移动到点击位置
            const markerLine = trackRow.markerLine;
            markerLine.style.left = `${block_left}px`;

            // 计算临界宽度
            const { width: blueBlock_width, left: blueBlock_left } = recordingSegment.getBoundingClientRect();
            const critical = blueBlock_width + blueBlock_left - container_left;

            // 启动黄色刻度线的移动
            this.startMarkerMovement(markerLine, critical);

            // 触发双击事件回调
            if (this.onSegmentDblClick) {
              this.onSegmentDblClick({ time, event });
            }
          });
        }

        sliderContainer.appendChild(recordingSegment);
      });

      dragContainer.appendChild(sliderContainer);
      trackRow.appendChild(dragContainer);
      this.tracksContainer.appendChild(trackRow);
    });

    return this.tracksContainer;
  }

  // 黄色刻度线开始移动
  startMarkerMovement(markerLine, critical) {
    // 清除已有的定时器，防止重复启动（虽然我在前面已经清理过了）
    if (markerLine.movementInterval) {
      clearInterval(markerLine.movementInterval);
      markerLine.movementInterval = null;
    }

    markerLine.movementInterval = setInterval(() => {
      const currentLeft = parseInt(markerLine.style.left, 10) || 0;
      const newLeft = currentLeft + this.scaleWidth / this.scaleInterval; // 每秒移动

      if (newLeft >= critical) {
        clearInterval(markerLine.movementInterval); // 停止移动
        markerLine.style.left = `${critical}px`;
        const time = calculateTimeFromPosition(newLeft, this.scaleWidth, this.scaleInterval);
        markerLine.info = {
          time,
          critical,
          left: critical,
          criticalTime: calculateTimeFromPosition(critical, this.scaleWidth, this.scaleInterval),
        };
        console.log("Reached end of track", time);
      } else {
        markerLine.style.left = `${newLeft}px`;
        const time = calculateTimeFromPosition(newLeft, this.scaleWidth, this.scaleInterval);
        markerLine.info = {
          time,
          critical,
          left: newLeft,
          criticalTime: calculateTimeFromPosition(critical, this.scaleWidth, this.scaleInterval),
        };
        console.log("time", time);
      }
    }, 2000); // 每秒更新
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

  // 切换到前一天
  prevDay() {
    console.log("prevDay");
    this.date.setDate(this.date.getDate() - 1);
    this.render();
  }

  // 切换到后一天
  nextDay() {
    console.log("nextDay");
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

    if (this.tracksContainer) {
      for (let i = 0; i < this.tracksContainer.children.length; i++) {
        const track = this.tracksContainer.children[i];
        if (track.markerLine) {
          this.tracksInfoArr.push(track.markerLine.info);
        }
      }
    }

    if (direction === "in" && currentIndex < scales.length - 1) {
      // 放大：切换到下一个更大的刻度
      this.scaleTime = scales[currentIndex + 1];
      this.scaleInterval = this.scaleMap[this.scaleTime]; // 更新刻度间隔
      console.log("Zoomed In:", this.scaleTime, this.scaleInterval);
      this.render();
    } else if (direction === "out" && currentIndex > 0) {
      // 缩小：切换到上一个更小的刻度
      this.scaleTime = scales[currentIndex - 1];
      this.scaleInterval = this.scaleMap[this.scaleTime]; // 更新刻度间隔
      console.log("Zoomed Out:", this.scaleTime, this.scaleInterval);
      this.render();
    } else {
      console.log(`Already at ${direction === "in" ? "maximum" : "minimum"} zoom level`);
    }
  }

  // 黄色刻度线计算并移动
  calculateAndMoveMarkerLine() {}

  // 更新录像数据
  updateData(newData) {
    this.data = newData;
    this.render();
  }

  // 设置日期变更回调
  setDateChangeCallback(callback) {
    this.onDateChange = callback;
  }
}
