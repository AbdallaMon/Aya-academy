"use client";

import {
  Excalidraw,
  MainMenu,
  useHandleLibrary,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

// Client-only Excalidraw wrapper. Loaded via next/dynamic({ ssr:false }) so the
// top-level "@excalidraw/excalidraw" import never runs on the server.
//
// We render our OWN <MainMenu> to drop Excalidraw's developer/marketing items
// (GitHub, "Follow us", Discord socials, and the Excalidraw+ promo) — leaving
// only the bits a teacher actually needs.
function BoardLibrarySync({ api, adapter }) {
  useHandleLibrary({ excalidrawAPI: api, adapter });
  return null;
}

export default function BoardCanvas({
  boardApi,
  libraryAdapter,
  ...props
}) {
  return (
    <>
      {libraryAdapter && (
        <BoardLibrarySync api={boardApi} adapter={libraryAdapter} />
      )}
      <Excalidraw {...props}>
        <MainMenu>
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.DefaultItems.ToggleTheme />
        </MainMenu>
      </Excalidraw>
    </>
  );
}
