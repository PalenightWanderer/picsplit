<script>
  import { adjustBoundsForText, stripBounds } from './slice.js';
  import { drawText } from './text.js';

  let {
    imgEl = null,
    naturalWidth = 0,
    naturalHeight = 0,
    tileCount = 2,
    textOptions = null,
    fitSlicesToText = false,
    xFrac = $bindable(0.5),
    yFrac = $bindable(0.5),
  } = $props();

  let canvas = $state();
  let container = $state();
  let scale = 1;
  let dragging = false;

  function draw() {
    if (!imgEl || !canvas || !container || !naturalWidth || !naturalHeight) return;
    const maxW = container.clientWidth || naturalWidth;
    scale = Math.min(1, maxW / naturalWidth);
    const cw = Math.max(1, Math.round(naturalWidth * scale));
    const ch = Math.max(1, Math.round(naturalHeight * scale));
    canvas.width = cw;
    canvas.height = ch;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(imgEl, 0, 0, cw, ch);

    let textLayout = null;
    if (textOptions?.text?.trim()) {
      const scaledOptions = { ...textOptions, fontSize: textOptions.fontSize * scale };
      textLayout = drawText(ctx, scaledOptions, cw, ch);
    }

    let bounds = stripBounds(naturalWidth, tileCount);
    if (fitSlicesToText && textLayout) {
      // textLayout was computed in scaled (canvas) space; convert bbox back to natural px.
      const pad = Math.max(4, textOptions.fontSize * 0.15);
      const naturalLeft = textLayout.left / scale - pad;
      const naturalRight = textLayout.right / scale + pad;
      bounds = adjustBoundsForText(bounds, [naturalLeft, naturalRight], naturalWidth);
    }
    const cuts = bounds.slice(1, -1).map((x) => x * scale);

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

  function positionFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
  }

  function handlePointerDown(e) {
    if (!textOptions?.text?.trim()) return;
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = positionFromEvent(e);
    xFrac = x;
    yFrac = y;
  }

  function handlePointerMove(e) {
    if (!dragging) return;
    const { x, y } = positionFromEvent(e);
    xFrac = x;
    yFrac = y;
  }

  function handlePointerUp(e) {
    dragging = false;
    if (canvas?.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  }

  $effect(() => {
    // re-run whenever any of these change
    void imgEl;
    void naturalWidth;
    void naturalHeight;
    void tileCount;
    void textOptions;
    void fitSlicesToText;
    void xFrac;
    void yFrac;
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
    <canvas
      bind:this={canvas}
      class:draggable={textOptions?.text?.trim()}
      onpointerdown={handlePointerDown}
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointercancel={handlePointerUp}
    ></canvas>
    {#if textOptions?.text?.trim()}
      <p class="hint drag-hint">Drag on the preview to move the text</p>
    {/if}
  {:else}
    <p class="placeholder">Choose an image to see the preview</p>
  {/if}
</div>
