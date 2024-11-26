class Timeline {
  constructor(container, initialDate, data) {
    this.container = container;
    this.date = new Date(initialDate); // 当前显示的日期
    this.data = data; // 录像数据
    this.zr = zrender.init(this.container); // zRender 实例

    this.padding = { top: 0, bottom: 0, left: 25, right: 25 };

    this.trackHeight = 30; // 每条轨道的高度
    this.trackGap = 0; // 每条轨道的间隔
    this.timelineWidth = this.container.offsetWidth - this.padding.left - this.padding.right;
    this.timelineHeight = this.container.offsetHeight - this.padding.top - this.padding.bottom;

    this.onDateChange = null; // 日期变更回调

    this.render();
  }

  // 绘制时间轴
  render() {
    this.zr.clear(); // 清空画布

    // 当前日期字符串
    const currentDateStr = this.date.toISOString().split("T")[0];
    // 获取当前日期的录像数据
    const recordingsPerTrack = this.data.map((trackData) => trackData[currentDateStr] || []);
    const totalTracks = recordingsPerTrack.length;
    const totalHours = 24;

    // 绘制时间刻度
    const rulerGroup = new zrender.Group({ position: [this.padding.left, this.padding.top] });

    for (let i = 0; i <= totalHours; i++) {
      const x = (i / totalHours) * this.timelineWidth;

      // 刻度线的高度和颜色
      const line = new zrender.Line({
        // x1-起始点横坐标 y1-起始点纵坐标 x2-终止点横坐标 y2-终止点纵坐标
        shape: { x1: x, y1: 15, x2: x, y2: 25 },
        style: { stroke: "#888", lineWidth: 1 },
      });

      // 刻度线文本，要进行 '1'->'01'的处理
      const zT = i >= 10 ? i : "0" + i;

      const text = new zrender.Text({
        style: {
          text: `${zT}:00`,
          x: x - 15,
          y: 0,
          fill: "#fff",
          fontSize: 12,
          textAlign: "center",
          textVerticalAlign: "bottom",
        },
      });

      rulerGroup.add(line);
      rulerGroup.add(text);
    }

    this.zr.add(rulerGroup);

    // 绘制录像段
    const tracksGroup = new zrender.Group({
      position: [this.padding.left, this.padding.top + 30], // 轨道组的位置
    });

    recordingsPerTrack.forEach((recordings, trackIndex) => {
      const y = trackIndex * (this.trackHeight + this.trackGap); // 当前轨道的纵向位置

      // 绘制轨道边框
      const borderShapes = [];

      // 上边框
      if (trackIndex === 0) {
        borderShapes.push({
          x1: 0,
          y1: y,
          x2: this.timelineWidth,
          y2: y,
        });
      }

      // 左边框
      borderShapes.push({
        x1: 0,
        y1: y,
        x2: 0,
        y2: y + this.trackHeight,
      });

      // 右边框
      borderShapes.push({
        x1: this.timelineWidth,
        y1: y,
        x2: this.timelineWidth,
        y2: y + this.trackHeight,
      });

      // 下边框
      borderShapes.push({
        x1: 0,
        y1: y + this.trackHeight,
        x2: this.timelineWidth,
        y2: y + this.trackHeight,
      });

      borderShapes.forEach(({ x1, y1, x2, y2 }) => {
        const borderLine = new zrender.Line({
          shape: { x1, y1, x2, y2 },
          style: {
            stroke: "#ccc",
            lineWidth: 1,
          },
        });
        tracksGroup.add(borderLine);
      });

      // 绘制录像段
      recordings.forEach(({ startTime, endTime }) => {
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);

        const startHour = startDate.getHours() + startDate.getMinutes() / 60;
        const endHour = endDate.getHours() + endDate.getMinutes() / 60;

        const xStart = (startHour / totalHours) * this.timelineWidth;
        const xEnd = (endHour / totalHours) * this.timelineWidth;
        const width = xEnd - xStart;

        const recordingSegment = new zrender.Rect({
          shape: {
            x: xStart,
            y: y,
            width: width,
            height: this.trackHeight,
          },
          style: {
            fill: "rgba(0, 128, 255, 0.7)",
          },
        });

        tracksGroup.add(recordingSegment);
      });
    });

    this.zr.add(tracksGroup);

    // 触发日期变更回调
    if (this.onDateChange) {
      this.onDateChange(currentDateStr);
    }
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
}
