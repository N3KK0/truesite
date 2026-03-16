// ─── Lerp & chemin (exports publics) ──────────────────────────────────────

function lerp(a, b, t) { return a + (b - a) * t; }

/**
 * interpPath(path, t) → { x, y }
 * Interpole une position le long d'un tableau de points { x, y }.
 * t ∈ [0, 1]
 */
function interpPath(path, t) {
  const seg = path.length - 1;
  const s   = t * seg;
  const i   = Math.min(Math.floor(s), seg - 1);
  const lt  = s - i;
  return {
    x: lerp(path[i].x, path[i + 1].x, lt),
    y: lerp(path[i].y, path[i + 1].y, lt),
  };
}

/**
 * interpScale(scales, t) → number
 * Interpole une valeur scalaire le long d'un tableau de nombres.
 */
function interpScale(scales, t) {
  const seg = scales.length - 1;
  const s   = t * seg;
  const i   = Math.min(Math.floor(s), seg - 1);
  return lerp(scales[i], scales[Math.min(i + 1, seg)], s - i);
}

/**
 * getScrollT(selector?) → number ∈ [0, 1]
 * Progression de scroll relative à un conteneur (défaut : '.hero').
 */
function getScrollT(selector = '.hero') {
  const container = document.querySelector(selector);
  if (!container) return 0;
  const max = container.offsetHeight - window.innerHeight;
  return max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
}


// ─── animatePath ──────────────────────────────────────────────────────────

/**
 * animatePath(id, path, scales, options?)
 *
 * Anime un élément le long d'un chemin avec échelle variable.
 * Gère le flip directionnel automatiquement.
 *
 * @param {string}   id       - ID CSS de l'élément
 * @param {Array}    path     - Tableau { x, y } en vw/vh
 * @param {Array}    scales   - Tableau de nombres (même longueur que path)
 * @param {Object}   options
 *   @param {string}  [options.container='.hero'] - Sélecteur du conteneur scroll
 *   @param {number}  [options.flipDown=1]   - scaleX quand on scroll vers le bas
 *   @param {number}  [options.flipUp=1]     - scaleX quand on scroll vers le haut
 *   @param {string}  [options.unit='vw/vh'] - unité des coords x/y (non utilisé, vw+vh fixes)
 *
 * Exemples :
 *   animatePath('ship',    shipPath,    shipScaleArr, { flipDown:  1, flipUp: -1 })
 *   animatePath('seagull', seagullPath, seagullScaleArr, { flipDown: -1, flipUp:  1 })
 */
function animatePath(id, path, scales, options = {}) {
  const el = document.getElementById(id);
  if (!el) { console.warn(`animatePath: #${id} introuvable`); return; }

  const {
    container = '.hero',
    flipDown  =  1,
    flipUp    =  1,
  } = options;

  // Applique immédiatement la position initiale
  const applyFrame = (goingDown) => {
    const t     = getScrollT(container);
    const pos   = interpPath(path, t);
    const scale = interpScale(scales, t);
    const flipX = goingDown ? flipDown : flipUp;

    el.style.left      = pos.x + 'vw';
    el.style.top       = pos.y + 'vh';
    el.style.transform = `scaleX(${flipX * scale}) scaleY(${scale})`;
  };

  applyFrame(true); // position initiale

  // Enregistre dans le registre global pour le listener scroll partagé
  _pathAnimations.push(applyFrame);
}


// ─── Registre & listener scroll pour animatePath ─────────────────────────

const _pathAnimations = [];
let   _lastScrollY    = window.scrollY;
let   _goingDown      = true;

window.addEventListener('scroll', () => {
  _goingDown  = window.scrollY >= _lastScrollY;
  _lastScrollY = window.scrollY;
  _pathAnimations.forEach(fn => fn(_goingDown));
  _animations.forEach(fn => fn()); // listener animate() existant
}, { passive: true });