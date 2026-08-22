<script>
  let { onFile } = $props();

  let isDragging = $state(false);
  let fileInput;

  function handleDrop(e) {
    e.preventDefault();
    isDragging = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) onFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  }

  function openPicker() {
    fileInput.click();
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  }
</script>

<div
  class="dropzone"
  class:dragging={isDragging}
  role="button"
  tabindex="0"
  ondrop={handleDrop}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  onclick={openPicker}
  onkeydown={handleKeydown}
>
  <input type="file" accept="image/*" bind:this={fileInput} onchange={handleChange} hidden />
  <p class="dz-title">Drop an image here, or click to choose a file</p>
  <p class="dz-sub">PNG / JPG / WEBP (stays in your browser, never uploaded anywhere)</p>
</div>
