<script>
  let { format = $bindable('png'), quality = $bindable(0.92), disabled = false } = $props();
</script>

<div class="controls export-controls">
  <div class="control-group">
    <span class="control-label" id="export-format-label">Export format</span>
    <div class="button-group" role="group" aria-labelledby="export-format-label">
      {#each ['png', 'jpg', 'webp'] as f (f)}
        <button
          type="button"
          class:active={format === f}
          disabled={disabled}
          onclick={() => (format = f)}
        >{f.toUpperCase()}</button>
      {/each}
    </div>
  </div>

  {#if format !== 'png'}
    <div class="control-group">
      <label class="control-label" for="export-quality">
        Quality<span class="value">{Math.round(quality * 100)}%</span>
      </label>
      <input
        id="export-quality"
        type="range"
        min="0.4"
        max="1"
        step="0.01"
        bind:value={quality}
        disabled={disabled}
      />
    </div>
  {/if}
</div>
