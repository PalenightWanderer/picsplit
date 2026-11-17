<script>
  import JSZip from 'jszip';
  import Dropzone from './lib/Dropzone.svelte';
  import ControlsPanel from './lib/ControlsPanel.svelte';
  import TextPanel from './lib/TextPanel.svelte';
  import ExportPanel from './lib/ExportPanel.svelte';
  import PreviewCanvas from './lib/PreviewCanvas.svelte';
  import TileGrid from './lib/TileGrid.svelte';
  import { sliceImage } from './lib/slice.js';

  let imgEl = $state(null);
  let fileName = $state('');
  let naturalWidth = $state(0);
  let naturalHeight = $state(0);
  let tileCount = $state(4);
  let gutterTrim = $state(3);
  let tiles = $state([]);
  let error = $state('');
  let zipping = $state(false);

  // Text overlay state.
  let text = $state('');
  let fontFamily = $state('system-ui, sans-serif');
  let fontSize = $state(48);
  let fontWeight = $state(700);
  let color = $state('#ffffff');
  let align = $state('center');
  let shadowEnabled = $state(true);
  let shadowColor = $state('#000000');
  let shadowBlur = $state(6);
  let shadowOffsetX = $state(2);
  let shadowOffsetY = $state(2);
  let fitSlicesToText = $state(false);
  let xFrac = $state(0.5);
  let yFrac = $state(0.5);

  // Export state.
  let format = $state('png');
  let quality = $state(0.92);

  let textOptions = $derived({
    text,
    fontFamily,
    fontSize,
    fontWeight,
    color,
    align,
    xFrac,
    yFrac,
    shadow: {
      enabled: shadowEnabled,
      color: shadowColor,
      blur: shadowBlur,
      offsetX: shadowOffsetX,
      offsetY: shadowOffsetY,
    },
  });

  let debounceHandle;
  let generation = 0;

  function revokeAll(list) {
    for (const t of list) URL.revokeObjectURL(t.url);
  }

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      error = 'Please choose an image file.';
      return;
    }
    error = '';
    fileName = file.name;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        revokeAll(tiles);
        tiles = [];
        imgEl = img;
        naturalWidth = img.naturalWidth;
        naturalHeight = img.naturalHeight;
      };
      img.onerror = () => {
        error = 'Could not load that image. Try a different file.';
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      error = 'Could not read that file.';
    };
    reader.readAsDataURL(file);
  }

  // Regenerate tiles whenever the image, tile count, gutter trim, text
  // overlay, or export settings change.
  $effect(() => {
    const currentImg = imgEl;
    const w = naturalWidth;
    const h = naturalHeight;
    const n = tileCount;
    const trim = gutterTrim;
    const name = fileName;
    const opts = {
      text: { ...textOptions },
      fitSlicesToText,
      format,
      quality,
    };

    if (!currentImg) {
      tiles = [];
      return;
    }

    clearTimeout(debounceHandle);
    debounceHandle = setTimeout(async () => {
      const myGen = ++generation;
      const newTiles = await sliceImage(currentImg, w, h, n, trim, name, opts);
      if (myGen !== generation) {
        revokeAll(newTiles); // a newer request already superseded this one
        return;
      }
      revokeAll(tiles);
      tiles = newTiles;
    }, 120);

    return () => clearTimeout(debounceHandle);
  });

  async function handleDownloadAll() {
    if (!tiles.length) return;
    zipping = true;
    try {
      const zip = new JSZip();
      for (const tile of tiles) zip.file(tile.name, tile.blob);
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'picsplit-tiles.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } finally {
      zipping = false;
    }
  }

  function reset() {
    revokeAll(tiles);
    imgEl = null;
    fileName = '';
    naturalWidth = 0;
    naturalHeight = 0;
    tiles = [];
    error = '';
  }
</script>

<div class="app-shell">
  <header>
    <h1>picsplit</h1>
  </header>

  <main>
    {#if !imgEl}
      <Dropzone onFile={handleFile} />
    {:else}
      <div class="loaded-bar">
        <span class="filename">{fileName}</span>
        <span class="dims">{naturalWidth}×{naturalHeight}px</span>
        <button type="button" class="link-btn" onclick={reset}>Choose a different image</button>
      </div>
    {/if}

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <ControlsPanel bind:tileCount bind:gutterTrim disabled={!imgEl} />

    <TextPanel
      bind:text
      bind:fontFamily
      bind:fontSize
      bind:fontWeight
      bind:color
      bind:align
      bind:shadowEnabled
      bind:shadowColor
      bind:shadowBlur
      bind:shadowOffsetX
      bind:shadowOffsetY
      bind:fitSlicesToText
      disabled={!imgEl}
    />

    <ExportPanel bind:format bind:quality disabled={!imgEl} />

    <PreviewCanvas
      {imgEl}
      {naturalWidth}
      {naturalHeight}
      {tileCount}
      {textOptions}
      {fitSlicesToText}
      bind:xFrac
      bind:yFrac
    />

    <TileGrid {tiles} onDownloadAll={handleDownloadAll} {zipping} />
  </main>

  <footer>
    <p>This page works entirely in your browser!</p>
  </footer>
</div>
