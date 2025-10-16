import "@fontsource/quicksand";
import { levels } from "./levels.js";
import { App } from "./app.ts";

const app = new App(levels);

window.app = app;

app.setLevel(1);
app.setMode("user");
app.updateInfoLevel();

app.animate();
