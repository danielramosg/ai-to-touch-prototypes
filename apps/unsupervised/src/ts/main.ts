import "@fontsource/quicksand";
import { levels } from "./levels.js";
import { App } from "./app.ts";

const app = new App(levels);

window.app = app;

const params = new URLSearchParams(window.location.search);
const level = parseInt(params.get("level") || "1");

app.setLevel(level);
app.setMode("user");
app.updateInfoLevel();

app.animate();
