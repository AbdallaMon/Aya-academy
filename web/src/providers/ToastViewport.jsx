"use client";

// Keep react-toastify's global stylesheet off the critical render path. This
// component is dynamically mounted after hydration by AppProviders.
import "react-toastify/dist/ReactToastify.css";
import { AppToastContainer } from "./ToastProvider.jsx";

export default function ToastViewport() {
  return <AppToastContainer />;
}
