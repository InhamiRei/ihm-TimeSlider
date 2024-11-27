class Timeline {
  constructor(config) {
    this.container = this.getContainer(config.id);
    this.date = new Date(config.curDay); // 当前显示的日期
    this.data = config.data; // 录像数据
    this.zr = zrender.init(this.container); // zRender 实例

    this.padding = { top: 0, bottom: 0, left: 25, right: 25 };

    this.trackHeight = 25; // 每条轨道的高度
    this.trackGap = 0; // 每条轨道的间隔
    this.timelineWidth = this.container.offsetWidth - this.padding.left - this.padding.right;
    this.timelineHeight = this.container.offsetHeight - this.padding.top - this.padding.bottom;

    this.onDateChange = null; // 日期变更回调

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

    // 绘制上方刻度部分的边框
    const rulerBorder = new zrender.Rect({
      shape: {
        x: 0, // 从刻度起始点
        y: 0, // 上边距
        width: this.timelineWidth, // 刻度的宽度
        height: 30, // 刻度区域高度
      },
      style: {
        stroke: "#ccc", // 边框颜色
        lineWidth: 1, // 边框线宽
        fill: "transparent", // 刻度区域背景透明
      },
    });
    rulerGroup.add(rulerBorder);

    for (let i = 0; i <= totalHours; i++) {
      const x = (i / totalHours) * this.timelineWidth;

      // 需要对00:00和24:00不绘制刻度线
      if (i !== 0 && i !== 24) {
        const line = new zrender.Line({
          // x1-起始点横坐标 y1-起始点纵坐标 x2-终止点横坐标 y2-终止点纵坐标
          shape: { x1: x, y1: 23, x2: x, y2: 30 },
          style: { stroke: "#888", lineWidth: 1 },
        });

        rulerGroup.add(line);
      }

      // 需要对00:00和24:00做特殊的处理，因为会超出绘制的区域
      let cX = x - 15;
      if (i === 0) {
        cX = x + 3;
      }
      if (i === 24) {
        cX = x - 35;
      }

      const text = new zrender.Text({
        style: {
          text: i >= 10 ? `${i}:00` : `0${i}:00`, // 刻度线文本，要进行 '1'->'01'的处理
          x: cX,
          y: 7,
          fill: "#fff",
          fontSize: 12,
          textAlign: "center",
          textVerticalAlign: "bottom",
        },
      });

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

      // // 上边框
      // if (trackIndex === 0) {
      //   borderShapes.push({
      //     x1: 0,
      //     y1: y,
      //     x2: this.timelineWidth,
      //     y2: y,
      //   });
      // }

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
