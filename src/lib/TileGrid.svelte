<script>
  let { tiles = [], onDownloadAll, zipping = false } = $props();

  function downloadTile(tile) {
    const a = document.createElement('a');
    a.href = tile.url;
    a.download = tile.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
</script>

{#if tiles.length}
  <div class="export-section">
    <div class="export-header">
      <h2>Export tiles</h2>
      <button type="button" class="primary" onclick={onDownloadAll} disabled={zipping}>
        {zipping ? 'Zipping…' : 'Download All as ZIP'}
      </button>
    </div>

    <p class="reminder">
      ⚠️ <strong>Attach these to your X post in this exact order:</strong>
      the split1 file first, then split2, split3{tiles.length > 3 ? ', split4' : ''}, one at a
      time, left to right. X displays images by <em>upload/attach order</em>, not by filename, so
      drag them into the composer in numbered order.
    </p>

    <div class="tile-grid">
      {#each tiles as tile (tile.name)}
        <div class="tile-card">
          <img src={tile.url} alt={tile.name} />
          <div class="tile-card-footer">
            <span>{tile.name}</span>
            <button type="button" onclick={() => downloadTile(tile)}>Download</button>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
