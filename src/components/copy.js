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