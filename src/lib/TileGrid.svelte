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
        {zipping ? 'Zipping…' : 'Download as ZIP'}
      </button>
    </div>

    <p class="reminder">
      ⚠️ <strong>Attach these to your post in this same order as shown here.</strong> The tweet composer will show them in a grid but they will actually show in a horizontal scroller (as of August '26)
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
