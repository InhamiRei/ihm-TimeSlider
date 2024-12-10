import { createElement, getContainer } from "../utils/common.js";
import { plusSVG, prevDaySVG, nextDaySVG, minusSVG } from "./svg.js";

export default class ihm_TimeSlider {
  constructor(config) {
    this.container = getContainer(config.id);
    this.date = new Date(config.curDay); // 当前显示的日期
    this.data = config.data; // 录像数据

    this.padding = { top: 0, bottom: 0, left: 25, right: 25 };

    this.trackHeight = 25; // 每条轨道的高度
    this.trackGap = 0; // 每条轨道的间隔
    this.timelineWidth = this.container.offsetWidth - this.padding.left - this.padding.right;
    this.timelineHeight = this.container.offsetHeight - this.padding.top - this.padding.bottom;

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

    const totalHours = 24;

    const timelineContainer = createElement("div", "ihm-timeSlider-topbarContainer-timeline", {
      position: "relative",
      flexGrow: "1",
    });

    for (let i = 0; i <= totalHours; i++) {
      const x = (i / totalHours) * (this.timelineWidth - 160);

      if (i !== 0 && i !== 24) {
        const line = createElement("div", "", {
          position: "absolute",
          left: `${x}px`,
          bottom: "0",
          height: "7px",
          width: "1px",
          backgroundColor: "#888",
        });

        timelineContainer.appendChild(line);
      }

      let labelOffset = -15;
      if (i === 0) labelOffset = 3;
      if (i === 24) labelOffset = -35;

      const label = createElement("div", "", {
        position: "absolute",
        left: `${x + labelOffset}px`,
        bottom: "10px",
        color: "#fff",
        fontSize: "12px",
      });

      label.textContent = i >= 10 ? `${i}:00` : `0${i}:00`;

      timelineContainer.appendChild(label);
    }

    topbarContainer.appendChild(timelineContainer);

    return topbarContainer;
  }

  // 创建录像轨道
  renderTracks(recordingsPerTrack, totalTracks) {
    const totalHours = 24;
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
      });

      recordings.forEach(({ startTime, endTime }) => {
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);

        const startHour = startDate.getHours() + startDate.getMinutes() / 60;
        const endHour = endDate.getHours() + endDate.getMinutes() / 60;

        const xStart = (startHour / totalHours) * (this.timelineWidth - 160);
        const width = ((endHour - startHour) / totalHours) * (this.timelineWidth - 160);

        const recordingSegment = createElement("div", null, {
          position: "absolute",
          left: `${xStart}px`,
          top: "0",
          height: `${this.trackHeight}px`,
          width: `${width}px`,
          backgroundColor: "rgba(0, 128, 255, 0.7)",
        });

        // 双击事件
        recordingSegment.addEventListener("dblclick", (event) => {
          if (this.onSegmentDblClick) {
            const time = this.calculateTimeFromOffset(event.offsetX);
            this.onSegmentDblClick({ time, event });
          }
        });

        // 右键事件
        recordingSegment.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (this.onSegmentContextMenu) {
            const time = this.calculateTimeFromOffset(event.offsetX);
            this.onSegmentContextMenu({ time, event });
          }
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

  calculateTimeFromOffset(offsetX) {
    const totalHours = 24;
    const positionRatio = offsetX / (this.timelineWidth - 160);
    const totalSeconds = Math.round(positionRatio * totalHours * 3600);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const year = this.date.getFullYear();
    const month = String(this.date.getMonth() + 1).padStart(2, "0");
    const day = String(this.date.getDate()).padStart(2, "0");
    const time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    return `${year}-${month}-${day} ${time}`;
  }
}
