<script>
  import { cutPositions } from './slice.js';

  let { imgEl = null, naturalWidth = 0, naturalHeight = 0, tileCount = 2 } = $props();

  let canvas = $state();
  let container = $state();

  function draw() {
    if (!imgEl || !canvas || !container || !naturalWidth || !naturalHeight) return;
    const maxW = container.clientWidth || naturalWidth;
    const scale = Math.min(1, maxW / naturalWidth);
    const cw = Math.max(1, Math.round(naturalWidth * scale));
    const ch = Math.max(1, Math.round(naturalHeight * scale));
    canvas.width = cw;
    canvas.height = ch;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(imgEl, 0, 0, cw, ch);

    const cuts = cutPositions(naturalWidth, tileCount).map((x) => x * scale);
    ctx.save();
    ctx.strokeStyle = '#ff453a';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    for (const x of cuts) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, ch);
      ctx.stroke();
    }
    ctx.restore();
  }

  $effect(() => {
    // re-run whenever any of these change
    void imgEl;
    void naturalWidth;
    void naturalHeight;
    void tileCount;
    draw();
  });

  $effect(() => {
    if (!container) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(container);
    return () => ro.disconnect();
  });
</script>

<div class="preview-wrap" bind:this={container}>
  {#if imgEl}
    <canvas bind:this={canvas}></canvas>
  {:else}
    <p class="placeholder">Choose an image to see the preview</p>
  {/if}
</div>
