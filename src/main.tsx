
  import { createRoot } from "react-dom/client";
import App from "./app/App";
  import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <>
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:p-4 focus:bg-white focus:text-indigo-600 focus:rounded-lg focus:shadow-xl">Skip to content</a>
    <App />
  </>
);