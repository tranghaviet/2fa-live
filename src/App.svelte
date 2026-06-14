<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { generateTotp, secondsUntilNextCode, TotpSecretError } from './totp';

  let secret = '';
  let code = '';
  let error = '';
  let remainingSeconds = secondsUntilNextCode();
  let copied = false;
  let timerId: number | undefined;
  let generationId = 0;
  let secretInput: HTMLInputElement;

  $: progress = `${(remainingSeconds / 30) * 100}%`;
  $: copyDisabled = !code || Boolean(error);

  async function refreshCode() {
    const currentGeneration = ++generationId;
    remainingSeconds = secondsUntilNextCode();
    copied = false;

    if (!secret.trim()) {
      code = '';
      error = '';
      return;
    }

    try {
      const nextCode = await generateTotp(secret);
      if (currentGeneration !== generationId) return;
      code = nextCode;
      error = '';
    } catch (caughtError) {
      if (currentGeneration !== generationId) return;
      code = '';
      error =
        caughtError instanceof TotpSecretError
          ? caughtError.message
          : 'Unable to generate a code from this secret.';
    }
  }

  function handleSecretInput(event: Event) {
    secret = (event.currentTarget as HTMLInputElement).value;
    void refreshCode();
  }

  async function copyCode() {
    if (copyDisabled) return;
    await navigator.clipboard.writeText(code);
    copied = true;
  }

  onMount(() => {
    secretInput.focus();
    void refreshCode();
    timerId = window.setInterval(() => {
      const nextRemaining = secondsUntilNextCode();
      const expired = nextRemaining > remainingSeconds;
      remainingSeconds = nextRemaining;

      if (expired || (secret.trim() && !code && !error)) {
        void refreshCode();
      }
    }, 250);
  });

  onDestroy(() => {
    if (timerId) {
      window.clearInterval(timerId);
    }
  });
</script>

<main class="shell">
  <header class="header">
    <div>
      <p class="eyebrow">2FA Live</p>
      <h1>Instant TOTP code</h1>
    </div>
    <span class="status" aria-label="Local only">Local</span>
  </header>

  <label class="field">
    <span>Secret</span>
    <input
      autocomplete="one-time-code"
      autocapitalize="characters"
      spellcheck="false"
      placeholder="JBSWY3DPEHPK3PXP"
      bind:this={secretInput}
      value={secret}
      on:input={handleSecretInput}
    />
  </label>

  <section class:error class="codePanel" aria-live="polite">
    {#if error}
      <p class="message">{error}</p>
    {:else if code}
      <p class="code">{code.slice(0, 3)} {code.slice(3)}</p>
      <div class="meter" aria-label={`${remainingSeconds} seconds remaining`}>
        <span style={`width: ${progress}`}></span>
      </div>
      <p class="countdown">Changes in {remainingSeconds}s</p>
    {:else}
      <p class="empty">Enter a secret to generate a code.</p>
    {/if}
  </section>

  <button class="copyButton" disabled={copyDisabled} on:click={copyCode}>
    {copied ? 'Copied' : 'Copy code'}
  </button>
</main>

<style>
  .shell {
    display: flex;
    min-height: 420px;
    flex-direction: column;
    gap: 18px;
    padding: 22px;
  }

  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .eyebrow {
    margin: 0 0 5px;
    color: #286f6c;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    color: #15232d;
    font-size: 26px;
    line-height: 1.08;
  }

  .status {
    border: 1px solid #c9d7d4;
    border-radius: 999px;
    color: #286f6c;
    flex: 0 0 auto;
    font-size: 12px;
    font-weight: 700;
    padding: 5px 9px;
  }

  .field {
    display: grid;
    gap: 8px;
  }

  .field span {
    color: #45535f;
    font-size: 13px;
    font-weight: 700;
  }

  input {
    width: 100%;
    border: 1px solid #ccd4db;
    border-radius: 8px;
    background: #ffffff;
    color: #111b23;
    font-size: 15px;
    outline: none;
    padding: 12px 13px;
    transition:
      border-color 140ms ease,
      box-shadow 140ms ease;
  }

  input:focus {
    border-color: #28756e;
    box-shadow: 0 0 0 3px rgba(40, 117, 110, 0.16);
  }

  .codePanel {
    display: flex;
    min-height: 150px;
    flex-direction: column;
    justify-content: center;
    border: 1px solid #d6dde2;
    border-radius: 8px;
    background: #ffffff;
    padding: 20px;
  }

  .codePanel.error {
    border-color: #e3b9b5;
    background: #fff7f6;
  }

  .code,
  .empty,
  .message,
  .countdown {
    margin: 0;
  }

  .code {
    color: #15232d;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    font-size: 48px;
    font-weight: 800;
    letter-spacing: 0;
    line-height: 1;
    text-align: center;
  }

  .meter {
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: #e7ecef;
    margin-top: 18px;
  }

  .meter span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: #28756e;
    transition: width 200ms linear;
  }

  .countdown {
    color: #5d6973;
    font-size: 13px;
    font-weight: 700;
    margin-top: 10px;
    text-align: center;
  }

  .empty,
  .message {
    color: #5d6973;
    font-size: 15px;
    line-height: 1.45;
    text-align: center;
  }

  .message {
    color: #9b3026;
  }

  .copyButton {
    min-height: 46px;
    border-radius: 8px;
    background: #15232d;
    color: #ffffff;
    cursor: pointer;
    font-size: 15px;
    font-weight: 800;
    margin-top: auto;
    transition:
      background 140ms ease,
      transform 140ms ease,
      opacity 140ms ease;
  }

  .copyButton:enabled:hover {
    background: #0c151c;
  }

  .copyButton:enabled:active {
    transform: translateY(1px);
  }

  .copyButton:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
</style>
