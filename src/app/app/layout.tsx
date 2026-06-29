import type { Viewport } from "next";
import "./tma.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
  return <div className="tmaRoot">{children}</div>;
}
