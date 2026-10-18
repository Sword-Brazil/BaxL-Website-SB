import { Inter, Oxanium } from "next/font/google";

export const displayFont = Oxanium({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
export const bodyFont = Inter({ subsets: ["latin"], variable: "--font-body" });
