"use client";

import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

// Client-only Excalidraw wrapper. Loaded via next/dynamic({ ssr:false }) so the
// top-level "@excalidraw/excalidraw" import never runs on the server.
//
// We render our OWN <MainMenu> to drop Excalidraw's developer/marketing items
// (GitHub, "Follow us", Discord socials, and the Excalidraw+ promo) — leaving
// only the bits a teacher actually needs.
export default function BoardCanvas(props) {
  return (
    <Excalidraw {...props}>
      <MainMenu>
        <MainMenu.DefaultItems.SaveAsImage />
        <MainMenu.DefaultItems.ChangeCanvasBackground />
        <MainMenu.DefaultItems.ClearCanvas />
        <MainMenu.DefaultItems.ToggleTheme />
      </MainMenu>
    </Excalidraw>
  );
}
