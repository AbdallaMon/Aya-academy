/* Original SVG artwork. The prototype has no remote image or icon dependencies. */
(() => {
  const ink = '#254e45';
  const shapes = {
    leaf: '<path d="M62 15C24 9 9 33 26 53c19 16 42-1 36-38Z" fill="#85ba72"/><path d="m19 65 31-34M33 49l-1-17m10 9 13 1"/>',
    star: '<path d="m40 8 9 20 23 3-17 16 4 24-19-12-20 12 4-24L7 31l23-3Z" fill="#ffd46c"/>',
    drop: '<path d="M40 9C31 25 18 36 18 49a22 22 0 0 0 44 0C62 36 49 25 40 9Z" fill="#88d4e8"/><path d="M29 49c0 7 4 11 10 12" stroke="#fff"/>',
    tap: '<path d="M18 43V31h32v12h13v12H47V44H31v13H18" fill="#95bfd0"/><path d="M36 30V20m-10 0h20"/><path d="M24 62c-8 10-4 15 1 15s9-6-1-15" fill="#6fc2df" stroke="none"/>',
    bin: '<path d="m23 27 4 42h27l5-42" fill="#89b19a"/><path d="M19 24h44M32 24v-8h19v8m-15 12v21m12-21v21"/>',
    flower: '<path d="M40 53V32m0 14c-13-11-22-2-11 4l11 2m0-9c13-13 24-3 10 4" fill="#81ae70"/><path d="m22 52 5 21h27l5-21Z" fill="#da9876"/><g fill="#ffc45e"><circle cx="32" cy="20" r="10"/><circle cx="49" cy="20" r="10"/><circle cx="40" cy="10" r="9"/><circle cx="40" cy="29" r="9"/></g><circle cx="40" cy="20" r="8" fill="#b77843"/>',
    can: '<path d="M24 32h30v34H24z" fill="#8ec7b0"/><path d="M54 38c24-4 19 25 0 19m-30-9L10 34 4 40l20 21M33 32V19h21v14"/>',
    power: '<path d="M24 19a28 28 0 1 0 32 0" fill="#deeee4"/><path d="M40 8v31" stroke="#29795f" stroke-width="7"/>',
    bulb: '<path d="M27 51a24 24 0 1 1 26 0v12H27Z" fill="#ffdc7c"/><path d="M29 71h22M33 62V40m14 22V40m-14 2h14"/><path d="M9 16 4 11m67 5 5-5M40 3V0"/>',
    sun: '<circle cx="40" cy="40" r="20" fill="#f9c765"/><path d="M40 5v8m0 54v8M5 40h8m54 0h8M15 15l6 6m38 38 6 6M15 65l6-6m38-38 6-6" stroke="#c78e31"/><path d="M33 39h1m12 0h1m-12 9q5 4 10 0"/>',
    moon: '<path d="M51 12a29 29 0 1 0 17 40A29 29 0 0 1 51 12Z" fill="#ffdb88"/><path d="m60 10 3 7 8 1-6 5 1 8-6-4-7 4 1-8-5-5 8-1Z" fill="#e3b972" stroke="none"/>',
    book: '<path d="M40 19C29 10 16 11 7 15v47c14-4 23-3 33 4 10-7 21-8 33-4V15c-14-4-23-4-33 4Z" fill="#b1a8d1"/><path d="M40 20v45M16 26l15 3m-15 8 15 3m19-11 14-3m-14 14 14-3"/>',
    shelf: '<path d="M12 12h56v57H12z" fill="#e2b88d"/><path d="M18 48h44"/><path d="M21 21h9v26h-9z" fill="#8db79b"/><path d="M33 17h9v30h-9z" fill="#b9a8d2"/><path d="m44 25 8-3 8 23-8 3Z" fill="#f4c46c"/>',
    wrapper: '<path d="m16 23 12 4 12-9 14 9 11-3-6 31-10 7-14-5-14 5Z" fill="#e8a9b6"/><path d="m26 34 25 4-4 12-22-4" fill="#fff1d9"/>',
    box: '<path d="M14 30h52v35H14z" fill="#e9b586"/><path d="M10 21h60v12H10z" fill="#f4cca2"/><path d="M34 33h13v14H34z" fill="#fff5da"/>',
    bag: '<path d="m20 29-4 42h49l-4-42Z" fill="#f5cf74"/><path d="M29 32V20a11 11 0 0 1 22 0v12"/><path d="M41 56c-11-1-9-13 2-14 8 10 5 15-2 14Z" fill="#7caa78" stroke="none"/>',
    bottle: '<path d="M31 8h18v15l8 10v35H23V33l8-10Z" fill="#a0d0da"/><path d="M29 8h22m-28 35h34M23 58h34"/>',
    ball: '<circle cx="40" cy="40" r="29" fill="#e7b493"/><path d="m34 27 16 6-1 17-17 1-8-14Zm0 0 3-15m13 21 17-2M49 50l10 12M32 51l-6 15M24 37l-13-4"/>',
    wind: '<path d="M9 32h47c18 0 17-23 4-21-5 0-9 3-9 8M9 43h30m-29 12h47c17 0 16 19 4 20" fill="none" stroke="#74a7b7"/>',
    tree: '<path d="M35 43v29h12V43" fill="#ae815e"/><path d="M39 9c-11-5-21 4-20 15-19 2-17 24 0 27 8 4 17 1 22-3 23 13 43-12 24-23C67 12 52 4 39 9Z" fill="#91b97b"/>',
    bird: '<path d="M54 30c17 12 8 34-10 32-16 0-24-10-27-21L7 30l20 6c2-21 21-22 27-6Z" fill="#8fc4d4"/><path d="m59 34 12 4-12 5" fill="#f3c35e"/><circle cx="50" cy="31" r="2" fill="#254e45" stroke="none"/><path d="M29 43q4 15 18 2M36 62v9m11-9v9"/>',
    food: '<ellipse cx="41" cy="58" rx="32" ry="13" fill="#fcf5df"/><path d="M12 47c-2-24 31-27 34-7l-3 16H16Z" fill="#e5b47b"/><path d="m23 33-2 10m12-13-2 12"/><path d="M55 34c-15-7-18 15-8 22 5 4 7 0 11 1 15 0 16-27-3-23Z" fill="#d67b65"/><path d="M55 32q-2-9 7-13"/>',
    pen: '<path d="m19 54 33-39 14 13-33 39-19 5Z" fill="#f4c461"/><path d="m19 54 14 13m-15-9-4 14 13-5M52 15l5-6q4-4 9 1l7 7q4 4 0 8l-7 3" fill="#df9ba8"/><path d="m26 55 28-32"/>',
    door: '<path d="M18 10h47v62H18z" fill="#dcc6ab"/><path d="m25 17 31-3v58H25Z" fill="#bd9778"/><circle cx="47" cy="44" r="3" fill="#ffd173"/>',
    mosque: '<path d="M20 41h47v30H20z" fill="#b1ccb4"/><path d="M24 41c0-17 18-20 20-29 3 10 19 12 19 29Z" fill="#84ac94"/><path d="M5 20h12v51H5zm-2 0 8-12 8 12" fill="#dab889"/><path d="M38 71V56a7 7 0 0 1 14 0v15" fill="#fff4d8"/><path d="M43 12V5"/>',
    peace: '<path d="M11 22h58v36H44L30 70V58H11Z" fill="#a2c5af"/><path d="m24 39 10 10 21-21" stroke="#fff" stroke-width="5"/>',
    train: '<path d="M10 25h29v35H10z" fill="#529f92"/><path d="M14 11h26v17H14z" fill="#f1cc7e"/><path d="M39 38h29v22H39z" fill="#e4a480"/><path d="M53 23h10v15H53zM8 60h63"/><circle cx="22" cy="64" r="8" fill="#344f51"/><circle cx="57" cy="64" r="8" fill="#344f51"/><path d="M21 16h12v11H21z" fill="#e5f3e8"/>',
    trophy: '<path d="M24 13h32v20c0 27-32 27-32 0Z" fill="#f5ca6d"/><path d="M23 20H11c-3 19 9 23 18 24m28-24h12c3 19-9 23-18 24M40 51v16m-14 3h28"/>',
    arrow: '<path d="M65 40H15m20-20L15 40l20 20"/>',
    check: '<path d="m16 40 16 17 34-35" stroke-width="7"/>',
    help: '<circle cx="40" cy="40" r="30" fill="#fff8df"/><path d="M31 29c0-15 24-15 22 0-1 8-13 8-13 18m0 9v2"/>',
    sound: '<path d="M10 31h14L43 15v50L24 49H10Z" fill="#b0ccb6"/><path d="M53 27q16 13 0 26m7-35q26 22 0 44"/>',
    mute: '<path d="M10 31h14L43 15v50L24 49H10Z" fill="#b0ccb6"/><path d="m55 30 17 21m0-21L55 51"/>',
    reset: '<path d="M17 32a26 26 0 1 1 2 29M17 12v21h21"/>',
    close: '<path d="m20 20 40 40m0-40L20 60"/>',
    flag: '<path d="M17 71V11m0 2c16-13 28 13 46 0v29c-18 13-30-13-46 0" fill="#e1a889"/>',
  };
  shapes['tap-closed'] = shapes.tap.replace('<path d="M24 62c-8 10-4 15 1 15s9-6-1-15" fill="#6fc2df" stroke="none"/>', '');
  shapes['flower-dry'] = '<path d="M40 54V33q0-17-14-13m14 28q-15 1-19-10m19 6q13 1 18-9" stroke="#9d9a69"/><path d="m22 52 5 21h27l5-21Z" fill="#da9876"/><g fill="#dab38a"><circle cx="20" cy="26" r="9"/><circle cx="29" cy="31" r="9"/><circle cx="28" cy="20" r="8"/></g><circle cx="24" cy="26" r="6" fill="#ab865c"/>';
  shapes['bird-water'] = shapes.bird + '<path d="M12 72h53q-3 7-26 7-23 0-27-7Z" fill="#90cadd" stroke="#568b9a"/>';
  shapes['bird-empty'] = shapes.bird + '<path d="M12 72h53q-3 7-26 7-23 0-27-7Z" fill="#e7d8b5" stroke="#9f9b7b"/>';
  function icon(name, className = '') {
    return `<svg class="icon ${className}" viewBox="0 0 80 80" fill="none" stroke="${ink}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name] || shapes.star}</svg>`;
  }
  const mascot = (className = '') => `<svg class="mascot ${className}" viewBox="0 0 130 140" fill="none" aria-hidden="true"><ellipse cx="66" cy="127" rx="38" ry="7" fill="#264c4520"/><path d="M39 103 31 119m57-16 9 16" stroke="#466c5a" stroke-width="8" stroke-linecap="round"/><path d="M22 66 8 79m98-13 16-14" stroke="#466c5a" stroke-width="7" stroke-linecap="round"/><path d="M65 13c7-1 16 25 19 29 5 4 33 2 35 9 2 8-21 22-22 28-1 6 9 29 3 34-6 5-28-13-35-12-7 0-29 17-35 12-6-5 5-29 3-34-1-6-25-21-22-28 2-7 29-5 34-9 5-5 13-29 20-29Z" fill="#ffce69" stroke="#d29a45" stroke-width="2.5"/><ellipse cx="49" cy="66" rx="4" ry="6" fill="#284b42"/><ellipse cx="80" cy="66" rx="4" ry="6" fill="#284b42"/><path d="M56 81q9 10 18 0" stroke="#284b42" stroke-width="3" stroke-linecap="round"/><ellipse cx="39" cy="78" rx="7" ry="4" fill="#ec9e72"/><ellipse cx="90" cy="78" rx="7" ry="4" fill="#ec9e72"/><path d="M64 16C61-1 78-1 82 4c-2 12-13 15-18 12Z" fill="#6d9c62"/></svg>`;
  const gardenBase = `<rect width="800" height="460" fill="#e5f2e9"/><circle cx="122" cy="75" r="36" fill="#f4d681"/><g fill="#fffdf1"><path d="M205 67c-3-27 40-31 44-7 23-6 38 18 25 26h-84c-10-7-4-17 15-19Z"/><path d="M431 57c0-22 30-29 41-9 25-6 40 20 20 26h-74c-9-9-1-17 13-17Z"/></g><path d="M0 200Q150 96 345 200T800 157V460H0Z" fill="#c7ddba"/><path d="M0 281Q185 182 410 252T800 234V460H0Z" fill="#a8c898"/><path d="M0 330Q192 284 405 325T800 319V460H0Z" fill="#b9d1a1"/><path d="M310 460c90-85 146-69 145-129s73-76 119-75" stroke="#eae1bd" stroke-width="64" fill="none"/><g stroke="#8b795b" stroke-width="5"><path d="M55 231V126"/><path d="M41 231h30"/></g><g fill="#88b17d"><circle cx="55" cy="105" r="45"/><circle cx="25" cy="134" r="35"/><circle cx="81" cy="137" r="38"/></g><path d="M515 118h180v140H515Z" fill="#f3d8b1"/><path d="m494 123 110-78 112 78Z" fill="#c48c73"/><path d="M538 160h44v43h-44Z" fill="#87bcb7" stroke="#fff1d8" stroke-width="8"/><path d="M612 258v-75c0-38 51-38 51 0v75" fill="#a7bdb0"/><path d="M524 260h172" stroke="#b29472" stroke-width="9"/><g stroke="#9c876b" stroke-width="8" stroke-linecap="round"><path d="M389 281h110m-110 19h110m-98 0v30m84-30v30"/></g><g fill="#79a773"><ellipse cx="752" cy="235" rx="45" ry="30"/><ellipse cx="768" cy="209" rx="33" ry="36"/></g><g stroke="#719962" stroke-width="3" fill="none"><path d="m68 361 4-12 5 12 5-8m517 67 4-12 5 12 5-8M276 249l4-12 5 12 5-8m426 138 4-12 5 12 5-8"/></g>`;
  const positions = {
    tap: [12, 56], wrapper: [39, 80], flower: [88, 61], lamp: [44, 35],
    book: [57, 70], food: [22, 76], bird: [26, 39], bag: [73, 71]
  };
  const names = { tap: 'الصنبور', wrapper: 'الغلاف', flower: 'الزهرة', lamp: 'المصباح', book: 'الكتاب', food: 'الطعام', bird: 'العصفور', bag: 'الحقيبة' };
  const drawing = { lamp: 'bulb', ...Object.fromEntries(Object.keys(names).filter(x => x !== 'lamp').map(x => [x, x])) };
  function gardenCover() {
    const items = Object.entries(positions).map(([key, [x,y]]) => `<g transform="translate(${x * 8 - 32},${y * 4.6 - 32}) scale(.85)" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">${shapes[drawing[key]]}</g>`).join('');
    return `<svg class="cover-art" viewBox="0 0 800 460" aria-hidden="true">${gardenBase}${items}<path d="M0 446Q180 420 410 450T800 436V460H0" fill="#8eb57e"/></svg>`;
  }
  function garden(completed, selected, hinted, solved) {
    return `<div class="garden-scene"><svg class="garden-backdrop" viewBox="0 0 800 460" aria-hidden="true">${gardenBase}</svg>${Object.entries(positions).map(([key, [x, y]]) => {
      const done = completed.includes(key);
      let symbol = drawing[key];
      if(key === 'tap' && done) symbol = 'tap-closed';
      if(key === 'flower' && !done) symbol = 'flower-dry';
      if(key === 'bird') symbol = done ? 'bird-water' : 'bird-empty';
      if(done && key === 'wrapper') symbol = 'bin';
      if(done && key === 'book') symbol = 'shelf';
      if(done && key === 'food') symbol = 'box';
      return `<button class="scene-object ${done ? 'cared' : ''} ${selected === key ? 'selected' : ''} ${hinted === key ? 'hinted' : ''} ${key === 'lamp' && !done ? 'lamp-on' : ''}" style="--x:${x}%;--y:${y}%" data-object="${key}" id="object-${key}" aria-label="${names[key]}${done ? '، اعتنينا به' : ''}" ${solved ? 'disabled' : ''}>${icon(symbol)}<span>${names[key]}</span>${done ? '<b class="care-check" aria-hidden="true">✓</b>' : ''}</button>`;
    }).join('')}<div class="scene-caption">واحة آية <span>•</span> ${completed.length ? 'تزداد جمالًا بفضل عنايتك' : 'كل عمل صغير يصنع فرقًا'}</div></div>`;
  }
  function trainCover() {
    return `<svg class="cover-art" viewBox="0 0 800 460" aria-hidden="true"><rect width="800" height="460" fill="#f6ebd7"/><circle cx="639" cy="88" r="42" fill="#efc77b"/><g fill="#fffdf6"><path d="M120 86c0-28 47-35 52-9 28-9 47 21 25 30h-93c-12-8-6-19 16-21Z"/><path d="M410 58c0-21 30-25 38-6 23-4 37 18 15 25h-65c-11-7-6-17 12-19Z"/></g><path d="M0 238q120-126 271 0T580 225t220-13v248H0Z" fill="#dacfa7"/><path d="M0 306q164-105 376-2t424-29v185H0Z" fill="#b6c4a0"/><path d="M0 393h800m-800 21h800" stroke="#9d8e70" stroke-width="6"/><path d="M0 403h800" stroke="#d4bd90" stroke-width="25" stroke-dasharray="10 23"/><g transform="translate(69 205)"><path d="M42 37h90v115H42Z" fill="#448b7a"/><path d="M30 33h113v15H30Z" fill="#376f62"/><path d="M-5 93h54v58H-5Z" fill="#71a68c"/><path d="M3 59h20v37H3Z" fill="#527d71"/><path d="M57 56h54v42H57Z" fill="#d8ece2"/><path d="M-13 147h162v16H-13Z" fill="#e1ac69"/><circle cx="31" cy="166" r="23" fill="#385a53"/><circle cx="108" cy="166" r="23" fill="#385a53"/><circle cx="31" cy="166" r="10" fill="#eedcc0"/><circle cx="108" cy="166" r="10" fill="#eedcc0"/><g fill="#fffdf4" opacity=".9"><circle cx="9" cy="32" r="15"/><circle cx="-12" cy="3" r="20"/><circle cx="0" cy="-35" r="27"/></g></g>${[0,1,2].map((i) => `<g transform="translate(${250+i*150} 273)"><path d="M0 0h131v84H0Z" rx="10" fill="${['#d69c78','#e4be71','#aaa5c1'][i]}"/><path d="M-7 0h145" stroke="#8a7557" stroke-width="7"/><rect x="30" y="9" width="72" height="63" rx="12" fill="#fff6dd"/><text x="65" y="58" text-anchor="middle" font-family="Cairo, sans-serif" font-weight="800" font-size="47" fill="#34544c">${['م','ل','ق'][i]}</text><circle cx="26" cy="93" r="17" fill="#385a53"/><circle cx="105" cy="93" r="17" fill="#385a53"/><path d="M130 65h20" stroke="#6a7964" stroke-width="6"/></g>`).join('')}<path d="M750 284v-109m-22 0h50v48h-50Z" stroke="#8f896b" stroke-width="6" fill="#fff4da"/><path d="m739 196 7 7 14-16" stroke="#679477" stroke-width="4" fill="none"/></svg>`;
  }
  window.ExplorerArt = { icon, mascot, gardenCover, trainCover, garden };
})();
