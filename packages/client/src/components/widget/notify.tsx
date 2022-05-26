import React from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function NotifyPlace() {
  return (
    <div>
      <ToastContainer />
    </div>
  );
}

export type MsgType = "error" | "success" | "info" | "warning" | "dark";

const notify = (message: string, type?: MsgType) => {
  switch (type) {
    case "error":
      toast.error(message);
      break;

    case "success":
      toast.success(message);
      break;

    case "warning":
      toast.warn(message);
      break;

    case "info":
      toast.info(message);
      break;

    case "dark":
      toast.dark(message);
      break;

    default:
      toast.error(message);
      break;
  }
};

export { notify };
