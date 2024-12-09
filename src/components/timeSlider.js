class ihm_TimeSlider {
  constructor(config) {
    this.container = this.getContainer(config.id);
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

  // 获取元素
  getContainer(id) {
    const container = document.getElementById(id);
    if (!container) {
      throw new Error(`Container ${id} not found`);
    }
    return container;
  }

  // 主渲染方法
  render() {
    // 清空容器
    this.container.innerHTML = "";

    const currentDateStr = this.date.toISOString().split("T")[0];
    const recordingsPerTrack = this.data.map((trackData) => trackData[currentDateStr] || []);
    const totalTracks = recordingsPerTrack.length;

    // 创建时间轴容器
    const timelineContainer = document.createElement("div");
    timelineContainer.style.position = "relative";
    timelineContainer.style.paddingLeft = `${this.padding.left}px`;
    timelineContainer.style.paddingRight = `${this.padding.right}px`;

    // 添加顶部
    timelineContainer.appendChild(this.renderTopbar());
    // 添加录像轨道
    timelineContainer.appendChild(this.renderTracks(recordingsPerTrack, totalTracks));

    this.container.appendChild(timelineContainer);

    // 触发日期变更回调
    if (this.onDateChange) {
      this.onDateChange(currentDateStr);
    }
  }

  // 创建时间刻度
  renderTopbar() {
    const topbarContainer = document.createElement("div");
    topbarContainer.className = "ihm-timeSlider-topbarContainer";
    topbarContainer.style.position = "relative";
    topbarContainer.style.height = "30px";
    topbarContainer.style.border = "1px solid #ccc"; // 仅下边框
    topbarContainer.style.borderBottom = "none"; // 仅下边框
    topbarContainer.style.display = "flex";

    const infoContainer = document.createElement("div");
    infoContainer.className = "ihm-timeSlider-topbarContainer-info";
    infoContainer.style.width = "160px";
    infoContainer.style.display = "flex";
    infoContainer.style.alignItems = "center";
    infoContainer.style.justifyContent = "space-around";
    infoContainer.style.borderRight = "1px solid #ccc"; // 右边框
    infoContainer.innerHTML = `
    <svg t="1733727315169" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1106" width="18" height="18">
      <path d="M823.8 91H194.2C137.3 91 91 137.3 91 194.2v629.6C91 880.7 137.3 927 194.2 927h629.6c56.9 0 103.2-46.3 103.2-103.2V194.2C927 137.3 880.7 91 823.8 91z m41.3 732.8c0 22.8-18.5 41.3-41.3 41.3H194.2c-22.8 0-41.3-18.5-41.3-41.3V194.2c0-22.8 18.5-41.3 41.3-41.3h629.6c22.8 0 41.3 18.5 41.3 41.3v629.6z" p-id="1107" fill="#fff"></path>
      <path d="M710.3 478H540V307.7c0-17.1-13.9-31-31-31s-31 13.9-31 31V478H307.7c-17.1 0-31 13.9-31 31s13.9 31 31 31H478v170.3c0 17.1 13.9 31 31 31s31-13.9 31-31V540h170.3c17.1 0 31-13.9 31-31s-13.9-31-31-31z" p-id="1108" fill="#fff"></path>
    </svg>
    <svg t="1733725745183" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1644" width="18" height="18">
      <path d="M823.8 91H194.2C137.3 91 91 137.3 91 194.2v629.6C91 880.7 137.3 927 194.2 927h629.6c56.9 0 103.2-46.3 103.2-103.2V194.2C927 137.3 880.7 91 823.8 91z m41.3 732.8c0 22.8-18.5 41.3-41.3 41.3H194.2c-22.8 0-41.3-18.5-41.3-41.3V194.2c0-22.8 18.5-41.3 41.3-41.3h629.6c22.8 0 41.3 18.5 41.3 41.3v629.6z" p-id="1646" fill="#fff"></path>
      <path d="M510.448485 366.467879a31.030303 31.030303 0 0 1 0 43.876848l-109.723152 109.723152 109.723152 109.692121a31.030303 31.030303 0 1 1-43.876849 43.907879l-131.661575-131.661576a31.030303 31.030303 0 0 1 0-43.876848l131.661575-131.661576a31.030303 31.030303 0 0 1 43.876849 0z" fill="#fff" p-id="1646"></path>
      <path d="M325.818182 520.067879a31.030303 31.030303 0 0 1 31.030303-31.030303h310.30303a31.030303 31.030303 0 1 1 0 62.060606H356.848485a31.030303 31.030303 0 0 1-31.030303-31.030303z" fill="#fff" p-id="1647"></path>
    </svg>
    <span style="font-size: 14px; color: #fff;">2024-11-17</span>
    <svg t="1733725745183" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1644" width="18" height="18" style="transform:rotate(180deg);">>
      <path d="M823.8 91H194.2C137.3 91 91 137.3 91 194.2v629.6C91 880.7 137.3 927 194.2 927h629.6c56.9 0 103.2-46.3 103.2-103.2V194.2C927 137.3 880.7 91 823.8 91z m41.3 732.8c0 22.8-18.5 41.3-41.3 41.3H194.2c-22.8 0-41.3-18.5-41.3-41.3V194.2c0-22.8 18.5-41.3 41.3-41.3h629.6c22.8 0 41.3 18.5 41.3 41.3v629.6z" p-id="1646" fill="#fff"></path>
      <path d="M510.448485 366.467879a31.030303 31.030303 0 0 1 0 43.876848l-109.723152 109.723152 109.723152 109.692121a31.030303 31.030303 0 1 1-43.876849 43.907879l-131.661575-131.661576a31.030303 31.030303 0 0 1 0-43.876848l131.661575-131.661576a31.030303 31.030303 0 0 1 43.876849 0z" fill="#fff" p-id="1646"></path>
      <path d="M325.818182 520.067879a31.030303 31.030303 0 0 1 31.030303-31.030303h310.30303a31.030303 31.030303 0 1 1 0 62.060606H356.848485a31.030303 31.030303 0 0 1-31.030303-31.030303z" fill="#fff" p-id="1647"></path>
    </svg>
    <svg t="1733727410968" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1341" width="18" height="18">
      <path d="M818.4 98.2H199.6c-55.9 0-101.4 45.5-101.4 101.4v618.8c0 55.9 45.5 101.4 101.4 101.4h618.8c55.9 0 101.4-45.5 101.4-101.4V199.6c0-55.9-45.5-101.4-101.4-101.4zM859 818.4c0 22.4-18.2 40.6-40.6 40.6H199.6c-22.4 0-40.6-18.2-40.6-40.6V199.6c0-22.4 18.2-40.6 40.6-40.6h618.8c22.4 0 40.6 18.2 40.6 40.6v618.8z" p-id="1342" fill="#fff"></path>
      <path d="M706.8 478.6H311.2c-16.8 0-30.4 13.6-30.4 30.4 0 16.8 13.6 30.4 30.4 30.4h395.6c16.8 0 30.4-13.6 30.4-30.4 0-16.8-13.6-30.4-30.4-30.4z" p-id="1343" fill="#fff"></path>
    </svg>
    `;
    topbarContainer.appendChild(infoContainer);

    const totalHours = 24;
    const timelineContainer = document.createElement("div");
    timelineContainer.className = "ihm-timeSlider-topbarContainer-timeline";
    timelineContainer.style.flexGrow = "1";
    timelineContainer.style.position = "relative";

    for (let i = 0; i <= totalHours; i++) {
      const x = (i / totalHours) * (this.timelineWidth - 160);

      if (i !== 0 && i !== 24) {
        const line = document.createElement("div");
        line.style.position = "absolute";
        line.style.left = `${x}px`;
        line.style.bottom = "0";
        line.style.height = "7px";
        line.style.width = "1px";
        line.style.backgroundColor = "#888";
        timelineContainer.appendChild(line);
      }

      let labelOffset = -15;
      if (i === 0) labelOffset = 3;
      if (i === 24) labelOffset = -35;

      const label = document.createElement("div");
      label.style.position = "absolute";
      label.style.left = `${x + labelOffset}px`;
      label.style.bottom = "10px";
      label.style.color = "#fff";
      label.style.fontSize = "12px";
      label.textContent = i >= 10 ? `${i}:00` : `0${i}:00`;

      timelineContainer.appendChild(label);
    }

    topbarContainer.appendChild(timelineContainer);

    return topbarContainer;
  }

  // 创建录像轨道
  renderTracks(recordingsPerTrack, totalTracks) {
    const totalHours = 24;

    const tracksContainer = document.createElement("div");
    tracksContainer.className = "ihm-timeSlider-trackContainer";
    tracksContainer.style.position = "relative";

    recordingsPerTrack.forEach((recordings, trackIndex) => {
      const trackRow = document.createElement("div");
      trackRow.className = "ihm-timeSlider-trackContainer-trackRow";
      trackRow.style.position = "relative";
      trackRow.style.flexGrow = "1";
      trackRow.style.height = `${this.trackHeight}px`;
      trackRow.style.border = "1px solid #ccc";
      trackRow.style.borderBottom = "none";
      // 最后一个轨道元素
      if (trackIndex === totalTracks - 1) {
        trackRow.style.borderBottom = "1px solid #ccc";
      }
      trackRow.style.display = "flex";

      const infoContainer = document.createElement("div");
      infoContainer.className = "ihm-timeSlider-trackContainer-trackRow-info";
      infoContainer.style.width = "160px";
      infoContainer.style.display = "flex";
      infoContainer.style.alignItems = "center";
      infoContainer.style.justifyContent = "center";
      infoContainer.style.padding = "0 10px";
      infoContainer.style.borderRight = "1px solid #ccc"; // 右边框
      infoContainer.innerHTML = `
        <span style="font-size: 14px; color: #fff;">窗口${trackIndex + 1}</span>
      `;
      trackRow.appendChild(infoContainer);

      const sliderContainer = document.createElement("div");
      sliderContainer.className = "ihm-timeSlider-trackContainer-trackRow-slider";
      sliderContainer.style.flexGrow = "1";
      sliderContainer.style.position = "relative";

      recordings.forEach(({ startTime, endTime }) => {
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);

        const startHour = startDate.getHours() + startDate.getMinutes() / 60;
        const endHour = endDate.getHours() + endDate.getMinutes() / 60;

        const xStart = (startHour / totalHours) * (this.timelineWidth - 160);
        const width = ((endHour - startHour) / totalHours) * (this.timelineWidth - 160);

        const recordingSegment = document.createElement("div");
        recordingSegment.style.position = "absolute";
        recordingSegment.style.left = `${xStart}px`;
        recordingSegment.style.top = "0";
        recordingSegment.style.height = `${this.trackHeight}px`;
        recordingSegment.style.width = `${width}px`;
        recordingSegment.style.backgroundColor = "rgba(0, 128, 255, 0.7)";

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

  // 切换到前一天
  prevDay() {
    this.date.setDate(this.date.getDate() - 1);
    this.render();
  }

  // 切换到后一天
  nextDay() {
    this.date.setDate(this.date.getDate() + 1);
    this.render();
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
