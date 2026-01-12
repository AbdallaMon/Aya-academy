import React from "react";

export type Setter<T> = React.Dispatch<React.SetStateAction<T>>;
export type Action = {
  text: string;
  href: string;
  icon?: React.ComponentType;
};

export type ImageData = {
  src: string;
  alt: string;
};

export type PageTheme = "light" | "dark";
