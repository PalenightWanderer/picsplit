<script>
  import { hasLocalFontAccess, queryLocalFontFamilies, detectAvailableFonts } from './fontDetect.js';

  let {
    text = $bindable(''),
    fontFamily = $bindable('system-ui, sans-serif'),
    fontSize = $bindable(48),
    fontWeight = $bindable(700),
    color = $bindable('#ffffff'),
    align = $bindable('center'),
    shadowEnabled = $bindable(true),
    shadowColor = $bindable('#000000'),
    shadowBlur = $bindable(6),
    shadowOffsetX = $bindable(2),
    shadowOffsetY = $bindable(2),
    fitSlicesToText = $bindable(false),
    disabled = false,
  } = $props();

  const fontOptions = [
    { label: 'System UI', value: 'system-ui, sans-serif' },
    { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
    { label: 'Courier New', value: "'Courier New', Courier, monospace" },
    { label: 'Impact', value: 'Impact, Charcoal, sans-serif' },
    { label: 'Comic Sans MS', value: "'Comic Sans MS', 'Comic Sans', cursive" },
    { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
    { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  ];

  // 'idle' | 'loading' | 'ready-api' | 'ready-detected' | 'error'
  let systemFontStatus = $state('idle');
  let systemFonts = $state([]);

  async function loadSystemFonts() {
    systemFontStatus = 'loading';
    try {
      if (hasLocalFontAccess()) {
        // Chromium-based browsers: real enumeration via the Local Font
        // Access API (prompts for permission).
        systemFonts = await queryLocalFontFamilies();
        systemFontStatus = 'ready-api';
      } else {
        // Firefox, Safari, etc. have no such API — fall back to detecting
        // a curated list of common system fonts via canvas measurement.
        systemFonts = detectAvailableFonts();
        systemFontStatus = 'ready-detected';
      }
    } catch (err) {
      systemFontStatus = 'error';
    }
  }
</script>

<div class="controls text-controls">
  <div class="control-group full">
    <label class="control-label" for="overlay-text">Overlay text</label>
    <textarea
      id="overlay-text"
      rows="2"
      placeholder="Add text to the image (optional)"
      bind:value={text}
      disabled={disabled}
    ></textarea>
  </div>

  <div class="control-group">
    <label class="control-label" for="font-family">Font</label>
    <input
      id="font-family"
      type="text"
      list="font-family-options"
      bind:value={fontFamily}
      disabled={disabled}
      placeholder="Type or pick a font"
    />
    <datalist id="font-family-options">
      {#each fontOptions as f (f.value)}
        <option value={f.value}>{f.label}</option>
      {/each}
      {#each systemFonts as fam (fam)}
        <option value={fam}>{fam}</option>
      {/each}
    </datalist>
    <div class="font-browse-row">
      <button
        type="button"
        class="link-btn"
        onclick={loadSystemFonts}
        disabled={disabled || systemFontStatus === 'loading'}
      >
        {systemFontStatus === 'loading' ? 'Loading your fonts…' : 'Use a font installed on your computer'}
      </button>
    </div>
    {#if systemFontStatus === 'ready-api'}
      <p class="hint">Found {systemFonts.length} fonts on your system — pick one from the list above.</p>
    {:else if systemFontStatus === 'ready-detected'}
      <p class="hint">
        Your browser can't list fonts directly, so {systemFonts.length} common fonts were detected instead — pick one above, or just type any installed font's exact name.
      </p>
    {:else if systemFontStatus === 'error'}
      <p class="hint">Couldn't access system fonts (permission denied?). You can still type any installed font's exact name above.</p>
    {/if}
  </div>


  <div class="control-group">
    <label class="control-label" for="font-weight">Weight</label>
    <select id="font-weight" bind:value={fontWeight} disabled={disabled}>
      <option value={400}>Regular</option>
      <option value={600}>Semibold</option>
      <option value={700}>Bold</option>
      <option value={900}>Black</option>
    </select>
  </div>

  <div class="control-group">
    <label class="control-label" for="text-align">Alignment</label>
    <select id="text-align" bind:value={align} disabled={disabled}>
      <option value="left">Left</option>
      <option value="center">Center</option>
      <option value="right">Right</option>
    </select>
  </div>

  <div class="control-group">
    <label class="control-label" for="font-size">
      Size<span class="value">{fontSize}px</span>
    </label>
    <input id="font-size" type="range" min="12" max="200" step="1" bind:value={fontSize} disabled={disabled} />
  </div>

  <div class="control-group">
    <label class="control-label" for="font-color">Color</label>
    <input id="font-color" type="color" bind:value={color} disabled={disabled} />
  </div>

  <div class="control-group full shadow-group">
    <label class="control-label checkbox-label">
      <input type="checkbox" bind:checked={shadowEnabled} disabled={disabled} />
      Text shadow
    </label>
    {#if shadowEnabled}
      <div class="shadow-controls">
        <label>
          Color
          <input type="color" bind:value={shadowColor} disabled={disabled} />
        </label>
        <label>
          Blur<span class="value">{shadowBlur}px</span>
          <input type="range" min="0" max="30" step="1" bind:value={shadowBlur} disabled={disabled} />
        </label>
        <label>
          Offset X<span class="value">{shadowOffsetX}px</span>
          <input type="range" min="-20" max="20" step="1" bind:value={shadowOffsetX} disabled={disabled} />
        </label>
        <label>
          Offset Y<span class="value">{shadowOffsetY}px</span>
          <input type="range" min="-20" max="20" step="1" bind:value={shadowOffsetY} disabled={disabled} />
        </label>
      </div>
    {/if}
  </div>

  <div class="control-group full">
    <label class="control-label checkbox-label">
      <input type="checkbox" bind:checked={fitSlicesToText} disabled={disabled || !text.trim()} />
      Fit slices to text (nudge cuts so they never cut through the text)
    </label>
  </div>
</div>
