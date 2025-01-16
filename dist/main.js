!(function (e, t) {
  "object" == typeof exports && "object" == typeof module
    ? (module.exports = t())
    : "function" == typeof define && define.amd
    ? define([], t)
    : "object" == typeof exports
    ? (exports.createPoster = t())
    : (e.createPoster = t());
})(window, function () {
  return (function (e) {
    var t = {};
    function n(i) {
      if (t[i]) return t[i].exports;
      var r = (t[i] = { i: i, l: !1, exports: {} });
      return e[i].call(r.exports, r, r.exports, n), (r.l = !0), r.exports;
    }
    return (
      (n.m = e),
      (n.c = t),
      (n.d = function (e, t, i) {
        n.o(e, t) || Object.defineProperty(e, t, { enumerable: !0, get: i });
      }),
      (n.r = function (e) {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }),
          Object.defineProperty(e, "__esModule", { value: !0 });
      }),
      (n.t = function (e, t) {
        if ((1 & t && (e = n(e)), 8 & t)) return e;
        if (4 & t && "object" == typeof e && e && e.__esModule) return e;
        var i = Object.create(null);
        if ((n.r(i), Object.defineProperty(i, "default", { enumerable: !0, value: e }), 2 & t && "string" != typeof e))
          for (var r in e)
            n.d(
              i,
              r,
              function (t) {
                return e[t];
              }.bind(null, r)
            );
        return i;
      }),
      (n.n = function (e) {
        var t =
          e && e.__esModule
            ? function () {
                return e.default;
              }
            : function () {
                return e;
              };
        return n.d(t, "a", t), t;
      }),
      (n.o = function (e, t) {
        return Object.prototype.hasOwnProperty.call(e, t);
      }),
      (n.p = ""),
      n((n.s = 0))
    );
  })([
    function (e, t, n) {
      "use strict";
      n.r(t);
      const i = (e) => {
          const [t, n, i] = e.split(":").map(Number);
          return 3600 * t + 60 * n + i;
        },
        r = (e) => {
          const t = Math.floor(e / 3600),
            n = Math.floor((e % 3600) / 60),
            i = e % 60;
          return `${String(t).padStart(2, "0")}:${String(n).padStart(2, "0")}:${String(i).padStart(2, "0")}`;
        },
        s = (e, t, n, i) => ((t - e) / i) * n,
        o = (e, t, n) => {
          const i = (e / t) * n,
            r = Math.floor(i / 3600),
            s = Math.floor((i % 3600) / 60),
            o = Math.floor(i % 60);
          return `${String(r).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(o).padStart(2, "0")}`;
        },
        a = (e, t, n) => {
          const [i, r, s] = e.split(":").map(Number);
          return ((3600 * i + 60 * r + s) * t) / n;
        },
        l = (e, t, n = {}) => {
          const i = document.createElement(e);
          return t && (i.className = t), Object.assign(i.style, n), i;
        };
      class c {
        constructor(e) {
          if (!e || !e.container) throw new Error("The 'container' parameter is required and must be a valid DOM element.");
          if (
            ((t = e.container),
            !("object" == typeof HTMLElement
              ? t instanceof HTMLElement
              : t && "object" == typeof t && 1 === t.nodeType && "string" == typeof t.nodeName))
          )
            throw new Error("The 'container' parameter must be a valid DOM element.");
          var t;
          (this.styles = e.styles || {}),
            (this.container = e.container),
            (this.date = new Date(e.curDay || new Date().toISOString().split("T")[0])),
            (this.data = e.data),
            (this.padding = { top: 0, bottom: 0, left: 0, right: 0 }),
            (this.trackHeight = 25),
            (this.trackGap = 0),
            (this.timelineWidth = this.container.offsetWidth - this.padding.left - this.padding.right - 2),
            (this.timelineHeight = this.container.offsetHeight - this.padding.top - this.padding.bottom),
            (this.scaleTime = 24),
            (this.scaleWidth = 50),
            (this.scaleSeconds = 3600),
            (this.scaleMap = { 24: 3600, 48: 1800, 288: 300, 1440: 60 }),
            (this.onDateChange = null),
            (this.onSegmentDblClick = e.dbClick || null),
            (this.onSegmentContextMenu = e.rtClick || null),
            (this.tracksContainer = null),
            (this.timeIndicatorText = null),
            (this.tracksInfoArr = []),
            this.render();
        }
        render() {
          this.container.innerHTML = "";
          const e = this.date.toISOString().split("T")[0],
            t = this.data.map((t) => t[e] || []),
            n = t.length,
            i = l("div", "ihm-timeSlider-mainContainer", {
              position: "relative",
              paddingLeft: this.padding.left + "px",
              paddingRight: this.padding.right + "px",
            });
          i.appendChild(this.renderTopbar()),
            i.appendChild(this.renderTracks(t, n)),
            this.container.appendChild(i),
            this.onDateChange && this.onDateChange(e),
            this.bindingEvents();
        }
        renderTopbar() {
          const e = l("div", "ihm-timeSlider-topbarContainer", {
              position: "relative",
              height: "30px",
              border: "1px solid #ccc",
              borderBottom: "none",
              display: "flex",
            }),
            t = l("div", "ihm-timeSlider-topbarContainer-info", {
              position: "relative",
              width: "160px",
              minWidth: "160px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              borderRight: "1px solid #ccc",
            });
          (t.innerHTML = `\n      \n  <svg\n    class="ihm-timeSlider-plus-svg"\n    t="1733727315169"\n    class="icon"\n    viewBox="0 0 1024 1024"\n    version="1.1"\n    xmlns="http://www.w3.org/2000/svg"\n    p-id="1106"\n    width="18"\n    height="18"\n  >\n    <title>放大刻度轴</title>\n    <path\n      d="M823.8 91H194.2C137.3 91 91 137.3 91 194.2v629.6C91 880.7 137.3 927 194.2 927h629.6c56.9 0 103.2-46.3 103.2-103.2V194.2C927 137.3 880.7 91 823.8 91z m41.3 732.8c0 22.8-18.5 41.3-41.3 41.3H194.2c-22.8 0-41.3-18.5-41.3-41.3V194.2c0-22.8 18.5-41.3 41.3-41.3h629.6c22.8 0 41.3 18.5 41.3 41.3v629.6z"\n      p-id="1107"\n      fill="#fff"\n    ></path>\n    <path\n      d="M710.3 478H540V307.7c0-17.1-13.9-31-31-31s-31 13.9-31 31V478H307.7c-17.1 0-31 13.9-31 31s13.9 31 31 31H478v170.3c0 17.1 13.9 31 31 31s31-13.9 31-31V540h170.3c17.1 0 31-13.9 31-31s-13.9-31-31-31z"\n      p-id="1108"\n      fill="#fff"\n    ></path>\n  </svg>\n\n      \n  <svg\n    class="ihm-timeSlider-prev-svg"\n    t="1733725745183"\n    class="icon"\n    viewBox="0 0 1024 1024"\n    version="1.1"\n    xmlns="http://www.w3.org/2000/svg"\n    p-id="1644"\n    width="18"\n    height="18"\n  >\n    <title>前一天</title>\n    <path\n      d="M823.8 91H194.2C137.3 91 91 137.3 91 194.2v629.6C91 880.7 137.3 927 194.2 927h629.6c56.9 0 103.2-46.3 103.2-103.2V194.2C927 137.3 880.7 91 823.8 91z m41.3 732.8c0 22.8-18.5 41.3-41.3 41.3H194.2c-22.8 0-41.3-18.5-41.3-41.3V194.2c0-22.8 18.5-41.3 41.3-41.3h629.6c22.8 0 41.3 18.5 41.3 41.3v629.6z"\n      p-id="1646"\n      fill="#fff"\n    ></path>\n    <path\n      d="M510.448485 366.467879a31.030303 31.030303 0 0 1 0 43.876848l-109.723152 109.723152 109.723152 109.692121a31.030303 31.030303 0 1 1-43.876849 43.907879l-131.661575-131.661576a31.030303 31.030303 0 0 1 0-43.876848l131.661575-131.661576a31.030303 31.030303 0 0 1 43.876849 0z"\n      fill="#fff"\n      p-id="1646"\n    ></path>\n    <path\n      d="M325.818182 520.067879a31.030303 31.030303 0 0 1 31.030303-31.030303h310.30303a31.030303 31.030303 0 1 1 0 62.060606H356.848485a31.030303 31.030303 0 0 1-31.030303-31.030303z"\n      fill="#fff"\n      p-id="1647"\n    ></path>\n  </svg>\n\n      <span style="font-size: 14px; color: #fff;">${this.date.toLocaleDateString()}</span>\n      \n  <svg\n    class="ihm-timeSlider-next-svg"\n    t="1733725745183"\n    class="icon"\n    viewBox="0 0 1024 1024"\n    version="1.1"\n    xmlns="http://www.w3.org/2000/svg"\n    p-id="1644"\n    width="18"\n    height="18"\n    style="transform:rotate(180deg);"\n  >\n    <title>后一天</title>\n    <path\n      d="M823.8 91H194.2C137.3 91 91 137.3 91 194.2v629.6C91 880.7 137.3 927 194.2 927h629.6c56.9 0 103.2-46.3 103.2-103.2V194.2C927 137.3 880.7 91 823.8 91z m41.3 732.8c0 22.8-18.5 41.3-41.3 41.3H194.2c-22.8 0-41.3-18.5-41.3-41.3V194.2c0-22.8 18.5-41.3 41.3-41.3h629.6c22.8 0 41.3 18.5 41.3 41.3v629.6z"\n      p-id="1646"\n      fill="#fff"\n    ></path>\n    <path\n      d="M510.448485 366.467879a31.030303 31.030303 0 0 1 0 43.876848l-109.723152 109.723152 109.723152 109.692121a31.030303 31.030303 0 1 1-43.876849 43.907879l-131.661575-131.661576a31.030303 31.030303 0 0 1 0-43.876848l131.661575-131.661576a31.030303 31.030303 0 0 1 43.876849 0z"\n      fill="#fff"\n      p-id="1646"\n    ></path>\n    <path\n      d="M325.818182 520.067879a31.030303 31.030303 0 0 1 31.030303-31.030303h310.30303a31.030303 31.030303 0 1 1 0 62.060606H356.848485a31.030303 31.030303 0 0 1-31.030303-31.030303z"\n      fill="#fff"\n      p-id="1647"\n    ></path>\n  </svg>\n\n      \n  <svg\n    class="ihm-timeSlider-minus-svg"\n    t="1733727410968"\n    class="icon"\n    viewBox="0 0 1024 1024"\n    version="1.1"\n    xmlns="http://www.w3.org/2000/svg"\n    p-id="1341"\n    width="18"\n    height="18"\n  >\n    <title>缩小刻度轴</title>\n    <path\n      d="M818.4 98.2H199.6c-55.9 0-101.4 45.5-101.4 101.4v618.8c0 55.9 45.5 101.4 101.4 101.4h618.8c55.9 0 101.4-45.5 101.4-101.4V199.6c0-55.9-45.5-101.4-101.4-101.4zM859 818.4c0 22.4-18.2 40.6-40.6 40.6H199.6c-22.4 0-40.6-18.2-40.6-40.6V199.6c0-22.4 18.2-40.6 40.6-40.6h618.8c22.4 0 40.6 18.2 40.6 40.6v618.8z"\n      p-id="1342"\n      fill="#fff"\n    ></path>\n    <path\n      d="M706.8 478.6H311.2c-16.8 0-30.4 13.6-30.4 30.4 0 16.8 13.6 30.4 30.4 30.4h395.6c16.8 0 30.4-13.6 30.4-30.4 0-16.8-13.6-30.4-30.4-30.4z"\n      p-id="1343"\n      fill="#fff"\n    ></path>\n  </svg>\n\n    `),
            e.appendChild(t);
          const n = l("div", "ihm-timeSlider-topbarContainer-dragContainer", {
              position: "relative",
              overflow: "hidden",
              flexGrow: 1,
              height: "100%",
            }),
            i = l("div", "ihm-timeSlider-topbarContainer-timeline", {
              position: "absolute",
              display: "flex",
              alignItems: "center",
              height: "100%",
              left: "0",
              top: "0",
            }),
            r = ((e, t) => {
              const n = 3600 * e,
                i = (e) => {
                  const t = Math.floor(e / 3600),
                    n = Math.floor((e % 3600) / 60),
                    i = e % 60;
                  return `${String(t).padStart(2, "0")}:${String(n).padStart(2, "0")}:${String(i).padStart(2, "0")}`;
                },
                r = [];
              for (let e = 0; e <= n; e += t) r.push(i(e));
              return r;
            })(this.scaleTime, this.scaleSeconds);
          for (let e = 0; e <= this.scaleTime; e++) {
            let t = (1 / this.scaleTime) * (this.timelineWidth - 160);
            t > 50 ? (this.scaleWidth = t) : (t = this.scaleWidth);
            const n = l("div", "", {
                position: "relative",
                display: "flex",
                alignItems: "center",
                width: e === this.scaleTime ? "1px" : t + "px",
                height: "100%",
                backgroundColor: "red",
                color: "#fff",
                fontSize: "12px",
              }),
              s = 0 === e ? 0 : e === this.scaleTime ? -28 : -15;
            (n.innerHTML = `\n        <span style="user-select: none; margin-left: ${s}px;">${r[e].slice(
              0,
              5
            )}</span>\n        <div style="width: 1px; height: 4px; background-color: #fff; position: absolute; left: 0; bottom: 0;"></div>\n      `),
              i.appendChild(n);
          }
          return n.appendChild(i), e.appendChild(n), this.bindDragEvents(n, i), e;
        }
        renderTracks(e, t) {
          if (this.tracksContainer)
            for (let e = 0; e < this.tracksContainer.children.length; e++) {
              const t = this.tracksContainer.children[e];
              t.markerLine && t.markerLine.movementInterval && (clearInterval(t.markerLine.movementInterval), (t.markerLine.movementInterval = null));
            }
          return (
            (this.tracksContainer = l("div", "ihm-timeSlider-trackContainer", {
              position: "relative",
              maxHeight: this.styles.scrollHeight || "none",
              overflow: "auto",
            })),
            e.forEach((e, n) => {
              const c = n === t - 1,
                h = l("div", "ihm-timeSlider-trackContainer-trackRow", {
                  position: "relative",
                  flexGrow: "1",
                  height: this.trackHeight + "px",
                  border: "1px solid #ccc",
                  borderBottom: c ? "1px solid #ccc" : "none",
                  display: "flex",
                }),
                d = l("div", "ihm-timeSlider-trackContainer-trackRow-info", {
                  width: "160px",
                  minWidth: "160px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 10px",
                  borderRight: "1px solid #ccc",
                });
              (d.innerHTML = `\n        <span style="font-size: 14px; color: #fff;">窗口${n + 1}</span>\n      `), h.appendChild(d);
              const m = l("div", "ihm-timeSlider-trackContainer-dragContainer", {
                  position: "relative",
                  overflow: "hidden",
                  flexGrow: 1,
                  height: "100%",
                }),
                p = l("div", "ihm-timeSlider-trackContainer-trackRow-slider", {
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  height: "100%",
                  left: "0",
                  top: "0",
                }),
                f = l("div", "ihm-timeSlider-markerLine", {
                  position: "absolute",
                  top: "0",
                  left: "0",
                  width: "1px",
                  height: "100%",
                  zIndex: "2",
                  pointerEvents: "none",
                  backgroundColor: "yellow",
                });
              if ((p.appendChild(f), (h.markerLine = f), 0 !== this.tracksInfoArr.length)) {
                const e = this.tracksInfoArr[n];
                if ((console.log("info", e), e)) {
                  const { time: t, criticalTime: n } = e,
                    i = a(t, this.scaleWidth, this.scaleSeconds),
                    r = h.markerLine,
                    s = a(n, this.scaleWidth, this.scaleSeconds);
                  (r.style.left = i + "px"), this.startMarkerMovement(r, s, n);
                }
              }
              ((e, t, n) => {
                const o = [];
                let a = i("00:00:00");
                e.forEach((e) => {
                  const l = i(e.startTime.split(" ")[1]),
                    c = i(e.endTime.split(" ")[1]);
                  l > a && o.push({ start: r(a), end: r(l), width: s(a, l, t, n), color: "gray" }),
                    o.push({ start: r(l), end: r(c), width: s(l, c, t, n), color: "blue" }),
                    (a = c);
                });
                const l = i("24:00:00");
                return a < l && o.push({ start: r(a), end: r(l), width: s(a, l, t, n), color: "gray" }), o;
              })(e, this.scaleWidth, this.scaleSeconds).forEach((e) => {
                const t = l("div", null, { height: "100%", width: e.width + "px", backgroundColor: "" + e.color });
                "blue" === e.color &&
                  t.addEventListener("dblclick", (n) => {
                    const i = p.getBoundingClientRect().left,
                      r = n.clientX - i,
                      s = o(r, this.scaleWidth, this.scaleSeconds);
                    console.log("对应时间", s);
                    const a = h.markerLine;
                    a.style.left = r + "px";
                    const { width: l, left: c } = t.getBoundingClientRect(),
                      d = l + c - i,
                      m = e.end;
                    this.startMarkerMovement(a, d, m), this.onSegmentDblClick && this.onSegmentDblClick({ time: s, event: n });
                  }),
                  p.appendChild(t);
              }),
                m.appendChild(p),
                this.bindHoverEvents(p),
                h.appendChild(m),
                this.tracksContainer.appendChild(h);
            }),
            this.tracksContainer
          );
        }
        startMarkerMovement(e, t, n) {
          e.movementInterval && (clearInterval(e.movementInterval), (e.movementInterval = null));
          const i = this.scaleWidth / this.scaleSeconds,
            r = () => {
              const r = (parseFloat(e.style.left) || 0) + i;
              if (r >= t) {
                clearInterval(e.movementInterval), (e.movementInterval = null), (e.style.left = t + "px");
                const i = o(t, this.scaleWidth, this.scaleSeconds);
                (e.info = { time: i, criticalTime: n }), console.log("Reached end of track", i);
              } else {
                e.style.left = r + "px";
                const t = o(r, this.scaleWidth, this.scaleSeconds);
                (e.info = { time: t, criticalTime: n }), console.log("time", t);
              }
            };
          r(), (e.movementInterval = setInterval(r, 1e3));
        }
        bindingEvents() {
          [
            { selector: ".ihm-timeSlider-plus-svg", handler: () => this.adjustTimeLine("in") },
            { selector: ".ihm-timeSlider-prev-svg", handler: () => this.prevDay() },
            { selector: ".ihm-timeSlider-next-svg", handler: () => this.nextDay() },
            { selector: ".ihm-timeSlider-minus-svg", handler: () => this.adjustTimeLine("out") },
          ].forEach(({ selector: e, handler: t }) => {
            const n = this.container.querySelector(e);
            n && n.addEventListener("click", t);
          });
        }
        bindDragEvents(e, t) {
          let n = !1,
            i = 0,
            r = 0,
            s = 0,
            o = 0;
          const a = () => {
              document.querySelectorAll(".ihm-timeSlider-trackContainer-trackRow-slider").forEach((e) => {
                e.style.left = r + "px";
              });
            },
            l = () => {
              if (!n) return;
              const i = r + s,
                o = e.offsetWidth - t.offsetWidth;
              (r = Math.min(0, Math.max(o, i))), (t.style.left = r + "px"), a(), (s *= 0.9), Math.abs(s) > 0.1 && requestAnimationFrame(l);
            };
          e.addEventListener("wheel", (n) => {
            const i = n.deltaY > 0 ? 10 : -10;
            r += i;
            const s = e.offsetWidth - t.offsetWidth;
            (r = Math.min(0, Math.max(s, r))), (t.style.left = r + "px"), a();
          }),
            e.addEventListener("mousedown", (t) => {
              (n = !0), (i = t.clientX), (o = 0), (e.style.cursor = "grabbing");
            }),
            document.addEventListener("mousemove", (l) => {
              if (!n) return;
              const c = l.clientX - i;
              (s = c - o), (r += c), (i = l.clientX), (o = c);
              const h = e.offsetWidth - t.offsetWidth;
              (r = Math.min(0, Math.max(h, r))), (t.style.left = r + "px"), a();
            }),
            document.addEventListener("mouseup", () => {
              n && ((n = !1), requestAnimationFrame(l), (e.style.cursor = "default"));
            });
        }
        bindHoverEvents(e) {
          const t = l("div", "ihm-timeSlider-timeMarker", {
            position: "absolute",
            top: "0",
            left: "-9999px",
            width: "1px",
            height: "100%",
            zIndex: 10,
            pointerEvents: "none",
            backgroundColor: "red",
          });
          e.appendChild(t),
            e.addEventListener("mousemove", (n) => {
              const i = e.getBoundingClientRect().left,
                r = n.clientX - i,
                s = o(r, this.scaleWidth, this.scaleSeconds);
              (t.style.left = r + "px"), this.updateTimeDisplay(s, r);
            }),
            e.addEventListener("mouseleave", () => {
              (t.style.left = "-9999px"), (this.timeIndicatorText.style.left = "-9999px");
            });
        }
        updateTimeDisplay(e, t) {
          if (((this.timeIndicatorText = document.querySelector(".ihm-timeSlider-timeDisplay")), this.timeIndicatorText))
            this.timeIndicatorText.style.left = t - 18 + "px";
          else {
            this.timeIndicatorText = l("div", "ihm-timeSlider-timeDisplay", {
              position: "absolute",
              top: "0",
              left: t - 18 + "px",
              color: "#fff",
              fontSize: "10px",
            });
            this.container.querySelector(".ihm-timeSlider-topbarContainer-timeline").appendChild(this.timeIndicatorText);
          }
          this.timeIndicatorText.textContent = e;
        }
        prevDay() {
          console.log("prevDay"), this.date.setDate(this.date.getDate() - 1), this.render();
        }
        nextDay() {
          console.log("nextDay"), this.date.setDate(this.date.getDate() + 1), this.render();
        }
        adjustTimeLine(e) {
          const t = Object.keys(this.scaleMap)
              .map(Number)
              .sort((e, t) => e - t),
            n = t.indexOf(this.scaleTime);
          if (((this.tracksInfoArr = []), this.tracksContainer))
            for (let e = 0; e < this.tracksContainer.children.length; e++) {
              const t = this.tracksContainer.children[e];
              t.markerLine && this.tracksInfoArr.push(t.markerLine.info);
            }
          console.log("tracksInfoArr", this.tracksInfoArr),
            "in" === e && n < t.length - 1
              ? ((this.scaleTime = t[n + 1]),
                (this.scaleSeconds = this.scaleMap[this.scaleTime]),
                console.log("Zoomed In:", this.scaleTime, this.scaleSeconds),
                this.render())
              : "out" === e && n > 0
              ? ((this.scaleTime = t[n - 1]),
                (this.scaleSeconds = this.scaleMap[this.scaleTime]),
                console.log("Zoomed Out:", this.scaleTime, this.scaleSeconds),
                this.render())
              : console.log(`Already at ${"in" === e ? "maximum" : "minimum"} zoom level`);
        }
        setDateChangeCallback(e) {
          this.onDateChange = e;
        }
        destroy() {
          if (((this.container.innerHTML = ""), this.tracksContainer))
            for (let e = 0; e < this.tracksContainer.children.length; e++) {
              const t = this.tracksContainer.children[e];
              t.markerLine && t.markerLine.movementInterval && (clearInterval(t.markerLine.movementInterval), (t.markerLine.movementInterval = null));
            }
          [
            { selector: ".ihm-timeSlider-plus-svg", handler: () => this.adjustTimeLine("in") },
            { selector: ".ihm-timeSlider-prev-svg", handler: () => this.prevDay() },
            { selector: ".ihm-timeSlider-next-svg", handler: () => this.nextDay() },
            { selector: ".ihm-timeSlider-minus-svg", handler: () => this.adjustTimeLine("out") },
          ].forEach(({ selector: e, handler: t }) => {
            const n = this.container.querySelector(e);
            n && n.removeEventListener("click", t);
          }),
            document.removeEventListener("mousemove", this.mouseMoveHandler),
            document.removeEventListener("mouseup", this.mouseUpHandler),
            (this.container = null),
            (this.tracksContainer = null),
            (this.timeIndicatorText = null),
            (this.onDateChange = null),
            (this.onSegmentDblClick = null),
            (this.onSegmentContextMenu = null);
        }
      }
      function h(e, t) {
        return new c(e, t);
      }
      window.ihmTimeSilder = h;
      t.default = h;
    },
  ]).default;
});
