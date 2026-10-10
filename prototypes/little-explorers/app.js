(() => {
  'use strict';
  const games = window.ExplorerGames;
  const art = window.ExplorerArt;
  const main = document.querySelector('#main');
  const dialog = document.querySelector('#help-dialog');
  const announcer = document.querySelector('#announcer');
  const storageKey = 'ayah-little-explorers-v1';
  const number = value => String(value).replace(/\d/g, digit => '٠١٢٣٤٥٦٧٨٩'[digit]);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  let saved = readSaved();
  let screen = 'home';
  let gameId = null;
  let run = null;
  let muted = true;
  let audioContext;
  let particleTimer;
  let announceTimer;
  let toastTimer;

  function readSaved() {
    const clean = {};
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || '{}');
      for (const [id, game] of Object.entries(games)) {
        const result = raw?.[id];
        if (!Array.isArray(result) || result.length > game.questions.length) continue;
        if (!result.every((item, i) => item?.id === game.questions[i].id && Number.isInteger(item.mistakes) && item.mistakes >= 0 && typeof item.helped === 'boolean')) continue;
        clean[id] = result.map(({ id, mistakes, helped }) => ({ id, mistakes, helped }));
      }
    } catch { /* Playing remains available if storage is disabled or malformed. */ }
    return clean;
  }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch { /* No game dependency on storage. */ }
  }
  function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function announce(message) {
    clearTimeout(announceTimer);
    announcer.textContent = '';
    announceTimer = setTimeout(() => { announcer.textContent = message; }, 30);
  }
  function focusMain() {
    main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function rememberFocus(render) {
    const id = document.activeElement?.id;
    const y = window.scrollY;
    render();
    if (id) document.getElementById(id)?.focus({ preventScroll: true });
    window.scrollTo({ top: y, behavior: 'instant' });
  }
  function playSound(type = 'tap') {
    if (muted) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audioContext ||= new Audio();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      const tones = type === 'win' ? [392, 494, 587, 784] : type === 'good' ? [440, 554, 659] : [330];
      tones.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const start = audioContext.currentTime + index * .105;
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(.065, start + .014);
        gain.gain.exponentialRampToValueAtTime(.001, start + .22);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(start);
        oscillator.stop(start + .25);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    } catch { /* Audio is optional. */ }
  }
  function confetti(count = 22) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const host = document.querySelector('#confetti');
    const colors = ['#82ad81', '#ecc16b', '#d99176', '#a9aac7'];
    clearTimeout(particleTimer);
    host.innerHTML = Array.from({ length: count }, (_, i) => `<i style="--left:${Math.random() * 100}%;--delay:${Math.random() * .45}s;--color:${colors[i % colors.length]}"></i>`).join('');
    particleTimer = setTimeout(() => { host.innerHTML = ''; }, 3100);
  }
  function soundButton() {
    const button = document.querySelector('#sound');
    button.innerHTML = art.icon(muted ? 'mute' : 'sound');
    button.setAttribute('aria-label', muted ? 'تشغيل المؤثرات الصوتية' : 'كتم المؤثرات الصوتية');
    button.setAttribute('aria-pressed', String(!muted));
  }
  function toolbar(help = false) {
    return `<nav class="play-toolbar" aria-label="تنقّل اللعبة"><button class="button ghost" data-action="home">${art.icon('arrow')} كل المغامرات</button><div class="toolbar-end"><span class="mini-tag">على مهلك، خذ وقتك</span>${help ? `<button class="icon-button" data-action="help" aria-label="كيف ألعب؟">${art.icon('help')}</button>` : ''}</div></nav>`;
  }
  function home() {
    screen = 'home';
    gameId = null;
    main.innerHTML = `<section class="home-intro"><div class="eyebrow">${art.icon('star')} مغامرات آية الصغيرة</div><h1>نلعب اليوم، <em>ونكبر بالمعرفة.</em></h1><p>عالم صغير مليء بالاكتشافات. اختر مغامرتك، ودع المرح يبدأ!</p>${art.icon('star', 'hero-spark')}${art.icon('leaf', 'hero-leaf')}</section><section class="adventures" aria-label="اختر مغامرتك">${Object.entries(games).map(([id, game], i) => {
      const progress = saved[id]?.length || 0;
      const complete = progress === game.questions.length;
      return `<article class="adventure ${game.theme}"><div class="card-picture">${id === 'oasis' ? art.gardenCover() : art.trainCover()}<span class="game-number">${art.icon(game.icon)} المغامرة ${number(i + 1)}</span><span class="age-tag">${game.age}</span></div><div class="card-body"><div class="card-eyebrow">${game.eyebrow}</div><div class="card-title-row"><h2>${game.title}</h2><span class="title-icon">${art.icon(game.icon)}</span></div><p>${game.description}</p><div class="card-meta"><span>${art.icon('flag')} ٨ ${id === 'oasis' ? 'مهمات تفاعلية' : 'محطات وكلمات'}</span><span>${art.icon('help')} تلميحات تساعدك</span>${complete ? '<span class="completed-tag">اكتملت المغامرة ✓</span>' : progress ? `<span class="completed-tag">أنجزت ${number(progress)} من ٨</span>` : ''}</div><button class="button primary ${id === 'train' ? 'terracotta' : ''} wide" data-action="intro" data-game="${id}">${progress && !complete ? 'نكمل المغامرة' : id === 'oasis' ? 'هيا نحمي الواحة' : 'هيا نركب القطار'} ${art.icon('arrow')}</button></div></article>`;
    }).join('')}</section><aside class="home-note">${art.mascot()}<div><strong>أنا «نُور»، صديقك في كل مغامرة!</strong><p>جرّب، واسأل، وخذ وقتك. كل محاولة تعلّمنا شيئًا جديدًا.</p></div></aside>`;
    focusMain();
  }
  function intro(id) {
    if (!games[id]) return;
    gameId = id;
    screen = 'intro';
    const game = games[id];
    const progress = saved[id]?.length || 0;
    const resume = progress > 0 && progress < game.questions.length;
    main.innerHTML = `${toolbar()}<section class="intro-panel"><div class="intro-art">${id === 'oasis' ? art.gardenCover() : art.trainCover()}</div><div class="intro-content"><div class="eyebrow">${art.icon(game.icon)} ${game.eyebrow}</div><h1>${game.title}</h1><p>${game.description}</p><ol class="how-list">${game.steps.map(step => `<li>${step}</li>`).join('')}</ol><div class="intro-buttons"><button class="button primary ${id === 'train' ? 'terracotta' : ''}" data-action="start" data-resume="${resume}">${resume ? `نكمل من ${id === 'oasis' ? 'المهمة' : 'المحطة'} ${number(progress + 1)}` : 'أنا جاهز، لنبدأ!'} ${art.icon('arrow')}</button>${resume ? '<button class="button secondary" data-action="start" data-resume="false">أبدأ مغامرة جديدة</button>' : ''}${progress === game.questions.length ? '<button class="button secondary" data-action="saved-result">شاهد وسامي السابق</button>' : ''}</div><p class="resume-note">٨ مراحل · محاولات بلا حدود · ${game.age}</p></div></section>`;
    focusMain();
  }
  function start(resume) {
    const records = resume ? [...(saved[gameId] || [])] : [];
    run = { index: records.length, results: records };
    if (run.index >= games[gameId].questions.length) run = { index: 0, results: [] };
    if (!resume) { saved[gameId] = []; persist(); }
    screen = 'play';
    prepareQuestion();
    playSound('tap');
    renderGame();
    focusMain();
  }
  function prepareQuestion() {
    const question = games[gameId].questions[run.index];
    Object.assign(run, { solved: false, found: false, selected: [], mistakes: 0, helped: false, hintTarget: null, hintLetter: null, feedback: '', wrongOptions: [] });
    if (gameId === 'train') run.pool = shuffle([...question.word, ...question.extra].map((letter, id) => ({ id, letter })));
    else run.options = shuffle(question.options.map((option, id) => ({ ...option, id })));
  }
  function gameHeader() {
    const game = games[gameId];
    return `${toolbar(true)}<div class="game-topline"><div class="game-title">${art.icon(game.icon)}<div><h1>${game.title}</h1><small>${game.eyebrow}</small></div></div><div class="progress-count">${art.icon(gameId === 'oasis' ? 'leaf' : 'star')}<strong>${number(run.results.length)} من ٨</strong><span>${gameId === 'oasis' ? 'أوراق العناية' : 'نجوم الرحلة'}</span></div></div><ol class="journey" aria-label="التقدّم في المراحل">${game.questions.map((q, i) => `<li class="${i < run.results.length ? 'done' : i === run.index ? 'current' : ''}" ${i === run.index ? 'aria-current="step"' : ''}><span class="sr-only">المرحلة ${number(i + 1)}${i < run.results.length ? '، اكتملت' : i === run.index ? '، الحالية' : ''}</span></li>`).join('')}</ol>`;
  }
  function feedbackHtml() {
    if (!run.feedback && !run.solved) return '<div id="feedback-slot"></div>';
    const question = games[gameId].questions[run.index];
    return `<div id="feedback-slot" class="feedback ${run.solved ? 'success' : ''}">${run.solved ? `<strong>${gameId === 'oasis' ? 'عمل جميل يا حارس الواحة!' : `وصل القطار! ${question.vocalized}`}</strong>${question.fact}` : escape(run.feedback)}</div>${run.solved ? `<button class="button primary advance-button" data-action="next" id="next">${run.index === games[gameId].questions.length - 1 ? 'اكتملت المغامرة، أرني وسامي!' : gameId === 'oasis' ? 'إلى المهمة التالية' : 'إلى المحطة التالية'} ${art.icon('arrow')}</button>` : ''}`;
  }
  function renderGame() {
    if (screen !== 'play') return;
    const question = games[gameId].questions[run.index];
    main.innerHTML = gameHeader() + (gameId === 'oasis' ? renderOasis(question) : renderTrain(question)) + '<p class="game-tip">لا سباق مع الوقت. كل محاولة تقرّبك من الاكتشاف.</p>';
  }
  function renderOasis(q) {
    const completed = run.results.map(item => item.id);
    return `<div class="game-layout"><section class="stage-panel" aria-label="مشهد الواحة التفاعلي"><div class="stage-heading"><h2>${q.title}</h2><span class="step-label">المهمة ${number(run.index + 1)} من ٨</span></div><p class="mobile-mission">${q.prompt}</p>${art.garden(completed, run.found ? q.target : null, run.hintTarget, run.solved)}<div class="garden-legend"><span>${art.icon('leaf')} ${number(completed.length)} من ٨ أعمال عناية</span><span>${run.solved ? 'انظر إلى أثر عملك الجميل' : run.found ? 'وجدته! اختر كيف تعتني به' : 'المس الشيء الذي يحتاج العناية'}</span></div></section><aside class="mission-panel oasis-mission" aria-label="المهمة الحالية"><div class="mission-top">${art.mascot()}<div><strong>${run.found ? 'فكّر، كيف نساعده؟' : 'لدينا مهمة يا بطل!'}</strong><small>نُور معك خطوة بخطوة</small></div></div><p class="mission-prompt" id="question-prompt">${q.prompt}</p>${run.found ? `<div class="mission-options">${run.options.map(option => `<button class="option ${run.wrongOptions.includes(option.id) ? 'wrong' : ''} ${run.solved && option.correct ? 'correct' : ''}" data-option="${option.id}" id="option-${option.id}" ${run.solved || run.wrongOptions.includes(option.id) ? 'disabled' : ''}>${art.icon(option.icon)}<span>${option.text}</span></button>`).join('')}</div>` : '<div class="mission-instruction">١. اكتشف الشيء في الصورة.<br>٢. اختر التصرف المناسب للعناية به.</div>'}${!run.solved ? `<button class="button ghost hint-button" data-action="hint" id="hint">${art.icon('bulb')} أحتاج تلميحًا</button>` : ''}${feedbackHtml()}</aside></div>`;
  }
  function selectedWord() {
    return run.selected.map(id => run.pool.find(item => item.id === id).letter).join('');
  }
  function renderTrain(q) {
    const full = run.selected.length === [...q.word].length;
    return `<div class="game-layout"><section class="stage-panel train-stage" aria-label="ورشة تركيب الكلمات"><div class="stage-heading"><h2>ما الكلمة التي تبحث عنها؟</h2><span class="step-label">المحطة ${number(run.index + 1)} من ٨</span></div><div class="train-sky"><div class="picture-clue">${art.icon(q.icon)}</div><p class="clue-text" id="question-prompt"><small>انظر إلى الصورة وفكّر</small>${q.clue}</p></div><div class="train-workshop"><div class="direction-label">نركّب الحروف من اليمين إلى اليسار ${art.icon('arrow')}</div><div class="trainline ${run.solved ? 'depart' : ''}"><div class="wagons">${[...q.word].map((_, i) => {
      const letter = run.pool.find(item => item.id === run.selected[i])?.letter;
      return `<button class="wagon ${!letter ? 'empty' : ''} ${i === run.selected.length && !run.solved ? 'next-slot' : ''}" data-slot="${i}" id="slot-${i}" aria-label="العربة ${number(i + 1)}${letter ? `، الحرف ${letter}، اضغط لإزالته` : '، فارغة'}" ${!letter || run.solved ? 'disabled' : ''}><span>${letter || number(i + 1)}</span></button>`;
    }).join('')}</div><div class="engine">${art.icon('train')}</div></div><div class="word-preview ${!run.selected.length ? 'placeholder' : ''}" aria-label="الكلمة المركبة">${run.solved ? q.vocalized : selectedWord() || 'حروفك تتصل هنا لتصبح كلمة'}</div><p class="letter-bank-label">المس الحروف بالترتيب لوضعها في العربات</p><div class="letter-bank" aria-label="الحروف المتاحة">${run.pool.map(item => `<button class="letter ${run.selected.includes(item.id) ? 'used' : ''} ${run.hintLetter === item.letter ? 'hinted' : ''}" data-letter="${item.id}" id="letter-${item.id}" aria-label="حرف ${item.letter}" ${run.selected.includes(item.id) || full || run.solved ? 'disabled' : ''}>${item.letter}</button>`).join('')}</div><div class="train-actions"><button class="button primary terracotta" data-action="check" id="check-word" ${!full || run.solved ? 'disabled' : ''}>${art.icon('train')} حرّك القطار</button><button class="button ghost" data-action="clear" id="clear-word" ${!run.selected.length || run.solved ? 'disabled' : ''}>${art.icon('reset')} أرتّب من جديد</button></div></div></section><aside class="mission-panel train-mission"><div class="mission-top">${art.mascot()}<div><strong>كل حرف في مكانه!</strong><small>الخطأ فرصة لنجرّب مجددًا</small></div></div><p class="mission-prompt">${run.solved ? 'كلمة جديدة انضمّت إلى رحلتك.' : 'املأ العربات لتكوين الكلمة. لتغيير حرف، المس عربته أولًا.'}</p><div class="station-list" aria-label="محطات الرحلة">${games.train.questions.map((item, index) => `<span class="station-token ${index < run.results.length ? 'filled' : index === run.index ? 'current' : ''}" title="المحطة ${number(index + 1)}">${index < run.results.length ? art.icon(item.icon) : number(index + 1)}</span>`).join('')}</div>${!run.solved ? `<button class="button ghost hint-button" data-action="hint" id="hint">${art.icon('bulb')} ساعدني بحرف</button>` : ''}${feedbackHtml()}</aside></div>`;
  }
  function chooseObject(id) {
    if (run.solved || run.found) return;
    const q = games.oasis.questions[run.index];
    if (id !== q.target) {
      const alreadyCared = run.results.some(result => result.id === id);
      if (!alreadyCared) run.mistakes++;
      run.feedback = alreadyCared ? 'اعتنينا بهذا الشيء بالفعل. اقرأ المهمة وابحث عن صديق آخر يحتاجنا.' : 'انظر مرة أخرى يا مكتشف! هذا ليس الشيء المقصود في المهمة.';
      rememberFocus(renderGame);
      announce(run.feedback);
      return;
    }
    run.found = true;
    run.hintTarget = null;
    run.feedback = '';
    playSound();
    renderGame();
    announce('وجدته! اختر الآن التصرف المناسب.');
    const option = main.querySelector('.option');
    option?.focus({ preventScroll: true });
    if (window.innerWidth <= 780) main.querySelector('.mission-panel').scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }
  function chooseOption(id) {
    if (run.solved || !run.found || run.wrongOptions.includes(id)) return;
    const option = run.options.find(item => item.id === id);
    if (!option) return;
    if (option.correct) return solve();
    run.mistakes++;
    run.wrongOptions.push(id);
    run.feedback = option.feedback;
    rememberFocus(renderGame);
    main.querySelector('.option:not(:disabled)')?.focus({ preventScroll: true });
    announce(run.feedback);
  }
  function addLetter(id) {
    const q = games.train.questions[run.index];
    if (run.solved || run.selected.length >= [...q.word].length || run.selected.includes(id) || !run.pool.some(item => item.id === id)) return;
    run.selected.push(id);
    run.hintLetter = null;
    run.feedback = '';
    playSound();
    rememberFocus(renderGame);
    const target = run.selected.length === [...q.word].length ? document.getElementById('check-word') : main.querySelector('.letter:not(:disabled)');
    target?.focus({ preventScroll: true });
    announce(`أضفت حرف ${run.pool.find(item => item.id === id).letter}. ${number(run.selected.length)} من ${number([...q.word].length)} حروف.`);
  }
  function removeLetter(index) {
    if (run.solved || index >= run.selected.length || index < 0) return;
    const id = run.selected[index];
    run.selected.splice(index, 1);
    run.feedback = '';
    run.hintLetter = null;
    rememberFocus(renderGame);
    document.getElementById(`letter-${id}`)?.focus({ preventScroll: true });
    announce('أعدنا الحرف إلى الرصيف. يمكنك اختياره من جديد.');
  }
  function checkWord() {
    const q = games.train.questions[run.index];
    if (run.solved || run.selected.length !== [...q.word].length) return;
    if (selectedWord() === q.word) return solve();
    run.mistakes++;
    run.feedback = 'القطار ينتظر ترتيبًا آخر. اقرأ اللغز، والمس أي عربة لتغيير حرفها، أو اطلب تلميحًا.';
    rememberFocus(renderGame);
    announce(run.feedback);
  }
  function hint() {
    if (run.solved) return;
    run.helped = true;
    const q = games[gameId].questions[run.index];
    if (gameId === 'oasis') {
      run.feedback = run.found ? q.toolHint : q.hint;
      run.hintTarget = run.found ? null : q.target;
    } else {
      const word = [...q.word];
      const selection = [...selectedWord()];
      const position = word.findIndex((letter, index) => letter !== selection[index]);
      if (position === -1) run.feedback = 'كل الحروف في مكانها! اضغط «حرّك القطار» لنتحقق معًا.';
      else {
        run.hintLetter = word[position];
        run.feedback = `الحرف رقم ${number(position + 1)} هو «${word[position]}». ${position < selection.length ? 'المس عربته لتعدّل الترتيب.' : 'ابحث عنه على الرصيف.'}`;
      }
    }
    rememberFocus(renderGame);
    announce(run.feedback);
  }
  function solve() {
    if (run.solved) return;
    run.solved = true;
    run.hintTarget = null;
    run.hintLetter = null;
    const q = games[gameId].questions[run.index];
    run.results.push({ id: q.id, mistakes: run.mistakes, helped: run.helped });
    saved[gameId] = [...run.results];
    persist();
    rememberFocus(renderGame);
    announce(q.fact);
    playSound('good');
    confetti(16);
    document.getElementById('next')?.focus({ preventScroll: true });
    if (window.innerWidth <= 780) document.getElementById('feedback-slot')?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }
  function next() {
    if (!run?.solved) return;
    if (run.index === games[gameId].questions.length - 1) return finish();
    run.index++;
    prepareQuestion();
    renderGame();
    focusMain();
    announce(`المرحلة ${number(run.index + 1)}. ${games[gameId].questions[run.index].prompt || games[gameId].questions[run.index].clue}`);
  }
  function finish(existing = false) {
    screen = 'finish';
    const game = games[gameId];
    const results = saved[gameId] || [];
    const firstTry = results.filter(item => item.mistakes === 0 && !item.helped).length;
    main.innerHTML = `${toolbar()}<section class="finish"><div class="medal">${art.icon('trophy')}</div><div class="eyebrow">٨ اكتشافات تستحق الاحتفال</div><h1>أنت الآن ${game.badge}!</h1><p>${gameId === 'oasis' ? 'واحتنا أجمل بعنايتك. خذ هذه العادات الجميلة معك كل يوم.' : 'وصل قطارك إلى المحطة الأخيرة، وصارت معك ثماني كلمات جديدة.'}</p><div class="results-stats"><div class="stat"><strong>٨ / ٨</strong><span>${gameId === 'oasis' ? 'مهمات مكتملة' : 'كلمات ركّبتها'}</span></div><div class="stat"><strong>${number(firstTry)}</strong><span>من أول محاولة دون تلميح</span></div><div class="stat"><strong>${art.icon(game.icon)}</strong><span>وسام ${gameId === 'oasis' ? 'حارس الواحة' : 'قائد الكلمات'}</span></div></div><div class="learned-grid">${game.questions.map(q => `<div class="learned-item">${art.icon(gameId === 'oasis' ? 'leaf' : q.icon)}<span>${q.learned || q.vocalized}</span></div>`).join('')}</div><details class="review-details"><summary>دفتر اكتشافاتي — نتذكّر ما تعلّمناه</summary><ul>${game.questions.map(q => `<li><strong>${q.title || q.vocalized}</strong>${q.fact}</li>`).join('')}</ul></details><div class="finish-buttons"><button class="button primary" data-action="other">${art.icon(gameId === 'oasis' ? 'train' : 'leaf')} أجرّب المغامرة الأخرى</button><button class="button secondary" data-action="replay">${art.icon('reset')} ألعب من جديد</button><button class="button ghost" data-action="print">أطبع وسامي</button></div></section>`;
    focusMain();
    if (!existing) { playSound('win'); confetti(55); announce(`أكملت كل المراحل. أنت ${game.badge}!`); }
  }
  function showHelp() {
    const game = games[gameId];
    document.querySelector('#help-content').innerHTML = `<h2 id="help-title">كيف نلعب ${game.title}؟</h2><ol class="how-list">${game.steps.map(step => `<li>${step}</li>`).join('')}</ol><p>المراحل المكتملة تُحفظ على هذا المتصفح إذا كان التخزين متاحًا. تستطيع العودة من «كل المغامرات».</p>`;
    dialog.showModal();
  }
  main.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.dataset.object && screen === 'play' && gameId === 'oasis') return chooseObject(button.dataset.object);
    if (button.dataset.option !== undefined && screen === 'play' && gameId === 'oasis') return chooseOption(Number(button.dataset.option));
    if (button.dataset.letter !== undefined && screen === 'play' && gameId === 'train') return addLetter(Number(button.dataset.letter));
    if (button.dataset.slot !== undefined && screen === 'play' && gameId === 'train') return removeLetter(Number(button.dataset.slot));
    const action = button.dataset.action;
    if (action === 'home') home();
    else if (action === 'intro') intro(button.dataset.game);
    else if (action === 'start') start(button.dataset.resume === 'true');
    else if (action === 'saved-result') finish(true);
    else if (action === 'help') showHelp();
    else if (action === 'hint') hint();
    else if (action === 'check') checkWord();
    else if (action === 'next') next();
    else if (action === 'clear' && !run.solved) { run.selected = []; run.feedback = ''; run.hintLetter = null; renderGame(); main.querySelector('.letter:not(:disabled)')?.focus({ preventScroll: true }); announce('العربات جاهزة لترتيب جديد.'); }
    else if (action === 'replay') start(false);
    else if (action === 'other') intro(gameId === 'oasis' ? 'train' : 'oasis');
    else if (action === 'print') window.print();
  });
  document.querySelector('#brand').addEventListener('click', home);
  document.querySelector('#close-help').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
  document.querySelector('#sound').addEventListener('click', () => {
    muted = !muted;
    soundButton();
    if (muted && audioContext?.state === 'running') audioContext.suspend().catch(() => {});
    playSound('good');
    const message = muted ? 'المؤثرات الصوتية مكتومة' : 'المؤثرات الصوتية تعمل';
    announce(message);
    clearTimeout(toastTimer);
    document.querySelector('.sound-toast')?.remove();
    const toast = document.createElement('div');
    toast.className = 'sound-toast';
    toast.textContent = message;
    document.body.append(toast);
    toastTimer = setTimeout(() => toast.remove(), 2200);
  });
  soundButton();
  home();
})();
