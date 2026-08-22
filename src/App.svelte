<script>
  import JSZip from 'jszip';
  import Dropzone from './lib/Dropzone.svelte';
  import ControlsPanel from './lib/ControlsPanel.svelte';
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

  // Regenerate tiles whenever the image, tile count, or gutter trim changes.
  $effect(() => {
    const currentImg = imgEl;
    const w = naturalWidth;
    const h = naturalHeight;
    const n = tileCount;
    const trim = gutterTrim;
    const name = fileName;

    if (!currentImg) {
      tiles = [];
      return;
    }

    clearTimeout(debounceHandle);
    debounceHandle = setTimeout(async () => {
      const myGen = ++generation;
      const newTiles = await sliceImage(currentImg, w, h, n, trim, name);
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
    <p class="tagline">
      X Split Tool: slice one image into seamless tiles for X/Twitter multi-image posts.
    </p>
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

    <PreviewCanvas {imgEl} {naturalWidth} {naturalHeight} {tileCount} />

    <TileGrid {tiles} onDownloadAll={handleDownloadAll} {zipping} />
  </main>

  <footer>
    <p>Everything runs locally in your browser. Your image is never uploaded to a server.</p>
  </footer>
</div>
