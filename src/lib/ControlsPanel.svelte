<script>
  let { tileCount = $bindable(4), gutterTrim = $bindable(3), disabled = false } = $props();
  const options = [2, 3, 4];
</script>

<div class="controls">
  <div class="control-group">
    <span class="control-label" id="tile-count-label">Tile count</span>
    <div class="button-group" role="group" aria-labelledby="tile-count-label">
      {#each options as n (n)}
        <button
          type="button"
          class:active={tileCount === n}
          disabled={disabled}
          onclick={() => (tileCount = n)}
        >{n}</button>
      {/each}
    </div>
  </div>

  <div class="control-group">
    <label class="control-label" for="gutter-trim">
      Gutter trim <span class="value">{gutterTrim}px</span>
    </label>
    <input id="gutter-trim" type="range" min="0" max="10" step="1" bind:value={gutterTrim} disabled={disabled} />
    <p class="hint">
      Shaves this many pixels off each touching inner edge before export, so the seam lines back
      up once X's own tile gap is added.
    </p>
  </div>
</div>
