import { createElement, getContainer, createScale, createTimeBlocks } from "../utils/common.js";
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
    this.timeScale = 48;

    this.onDateChange = null; // 日期变更回调
    this.onSegmentDblClick = config.dbClick || null; // 双击事件回调
    this.onSegmentContextMenu = config.rtClick || null; // 右键事件回调

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
    const dragContainer = createElement("div", "ihm-timeSlider-dragContainer", {
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

    const scaleArr = createScale(this.timeScale);

    console.log("scaleArr", scaleArr);

    for (let i = 0; i <= this.timeScale; i++) {
      let x = (1 / this.timeScale) * (this.timelineWidth - 160);
      if (x < 50) x = 50;

      const scaleBlock = createElement("div", "", {
        position: "relative",
        display: "flex",
        alignItems: "center",
        // 如果是最后一个宽度为1
        width: i === this.timeScale ? "1px" : `${x}px`,
        height: "100%",
        backgroundColor: "red",
        color: "#fff",
        fontSize: "12px",
      });

      // 根据条件设置 margin-left
      const marginLeft = i === 0 ? 0 : i === this.timeScale ? -28 : -15;

      scaleBlock.innerHTML = `
        <span style="user-select: none; margin-left: ${marginLeft}px;">${scaleArr[i]}</span>
        <div style="width: 1px; height: 4px; background-color: #fff; position: absolute; left: 0; bottom: 0;"></div>
      `;

      timelineContainer.appendChild(scaleBlock);
    }

    // 添加拖动事件监听器
    let isDragging = false;
    let startX = 0;
    let currentLeft = 0;
    let velocity = 0;
    let lastDeltaX = 0;

    const updatePosition = () => {
      if (!isDragging) return;

      const newLeft = currentLeft + velocity;
      const maxLeft = 0;
      const minLeft = dragContainer.offsetWidth - timelineContainer.offsetWidth;

      // 应用限制并更新位置
      currentLeft = Math.min(maxLeft, Math.max(minLeft, newLeft));
      timelineContainer.style.left = `${currentLeft}px`;

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
    });

    document.addEventListener("mouseup", () => {
      if (!isDragging) return;

      isDragging = false;
      requestAnimationFrame(updatePosition); // 开始惯性滑动
    });

    dragContainer.appendChild(timelineContainer);
    topbarContainer.appendChild(dragContainer);

    return topbarContainer;
  }

  // 创建录像轨道
  renderTracks(recordingsPerTrack, totalTracks) {
    const tracksContainer = createElement("div", "ihm-timeSlider-trackContainer", {
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

      const sliderContainer = createElement("div", "ihm-timeSlider-trackContainer-trackRow-slider", {
        flexGrow: "1",
        position: "relative",
        display: "flex",
      });

      console.log("recordings", recordings);

      const scale = 50; // 30 minutes = 50px
      const timeBlocks = createTimeBlocks(recordings, scale);

      timeBlocks.forEach((block) => {
        console.log("block", block);
        const recordingSegment = createElement("div", null, {
          height: "100%",
          width: `${block.width}px`,
          backgroundColor: `${block.color}`,
        });

        sliderContainer.appendChild(recordingSegment);
      });
      trackRow.appendChild(sliderContainer);
      tracksContainer.appendChild(trackRow);
    });

    return tracksContainer;
  }

  // 绑定事件
  bindingEvents() {
    const eventMap = [
      { selector: ".ihm-timeSlider-plus-svg", handler: () => this.plusTimeLine() },
      { selector: ".ihm-timeSlider-prev-svg", handler: () => this.prevDay() },
      { selector: ".ihm-timeSlider-next-svg", handler: () => this.nextDay() },
      { selector: ".ihm-timeSlider-minus-svg", handler: () => this.minusTimeLine() },
    ];

    eventMap.forEach(({ selector, handler }) => {
      const element = this.container.querySelector(selector);
      if (element) {
        element.addEventListener("click", handler);
      }
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

  // 放大时间轴
  plusTimeLine() {
    console.log("plusTimeLine");
  }

  // 缩放时间轴
  minusTimeLine() {
    console.log("minusTimeLine");
  }

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
