import "@fontsource/quicksand";
import { levels } from "./levels.js";
import { App } from "./app.ts";

const app = new App(levels);

app.setLevel(2);
app.setMode("computer");
app.updateInfoLevel();

app.animate();
