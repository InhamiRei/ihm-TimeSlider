import { _styles } from "./variable.js";
import { customStyle } from "../utils/common.js";

export const __styles_empty_container = (flag, styles = {}, theme) => ({
  width: "100%",
  height: `${customStyle(styles.emptyHeight, "100px")}`,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  border: `1px solid ${_styles[theme].borderColor}`,
});
