import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./styles/main.css";

createApp(App).use(router).mount("#app");
