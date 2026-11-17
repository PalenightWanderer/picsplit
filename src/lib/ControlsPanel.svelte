<script>
  import { MAX_TILES } from './slice.js';

  let { tileCount = $bindable(4), gutterTrim = $bindable(3), disabled = false } = $props();
  const presets = [4, 8, 16, 20];

  function clampTileCount(n) {
    if (!Number.isFinite(n)) return tileCount;
    return Math.min(MAX_TILES, Math.max(1, Math.round(n)));
  }

  function handleCustomInput(e) {
    tileCount = clampTileCount(Number(e.target.value));
  }
</script>

<div class="controls">
  <div class="control-group">
    <span class="control-label" id="tile-count-label">Tile count<span class="value">{tileCount} / {MAX_TILES}</span></span>
    <div class="button-group" role="group" aria-labelledby="tile-count-label">
      {#each presets as n (n)}
        <button
          type="button"
          class:active={tileCount === n}
          disabled={disabled}
          onclick={() => (tileCount = n)}
        >{n}</button>
      {/each}
    </div>
    <input
      class="tile-count-input"
      type="number"
      min="1"
      max={MAX_TILES}
      step="1"
      value={tileCount}
      disabled={disabled}
      oninput={handleCustomInput}
      aria-label="Custom tile count"
    />
    <p class="hint">X/Twitter carousels support up to {MAX_TILES} images</p>
  </div>

  <div class="control-group">
    <label class="control-label" for="gutter-trim">
      Edge/gutter trim<span class="value">{gutterTrim}px</span>
    </label>
    <input id="gutter-trim" type="range" min="0" max="10" step="1" bind:value={gutterTrim} disabled={disabled} />
    <p class="hint">
      Trims this many pixels off each touching inner edge before exporting
    </p>
  </div>
</div>
