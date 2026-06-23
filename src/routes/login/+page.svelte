<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth-client';

	let email = $state('');
	let password = $state('');
	let errorMessage = $state('');
	let pending = $state(false);

	async function submit() {
		pending = true;
		errorMessage = '';

		const result = await authClient.signIn.email({
			email,
			password
		});

		pending = false;

		if (result.error) {
			errorMessage = result.error.message ?? 'Login failed.';
			return;
		}

		await goto(resolve('/dashboard'));
	}
</script>

<svelte:head>
	<title>Login | Perbasi Tower Management</title>
</svelte:head>

<main>
	<form
		onsubmit={(event) => {
			event.preventDefault();
			void submit();
		}}
	>
		<p class="eyebrow">PERBASI</p>
		<h1>Login</h1>

		<label>
			Email
			<input bind:value={email} type="email" autocomplete="email" required />
		</label>

		<label>
			Password
			<input bind:value={password} type="password" autocomplete="current-password" required />
		</label>

		{#if errorMessage}
			<p class="error" role="alert">{errorMessage}</p>
		{/if}

		<button disabled={pending}>{pending ? 'Signing in...' : 'Sign in'}</button>
	</form>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family:
			Inter,
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		background: #f6f7f4;
		color: #17211b;
	}

	main {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 32px;
	}

	form {
		width: min(420px, 100%);
		display: grid;
		gap: 18px;
	}

	.eyebrow {
		margin: 0;
		color: #b1222b;
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0;
	}

	h1 {
		margin: 0 0 8px;
		font-size: 2.5rem;
		line-height: 1;
		letter-spacing: 0;
	}

	label {
		display: grid;
		gap: 8px;
		font-weight: 700;
	}

	input {
		min-height: 44px;
		border: 1px solid #b9bfb7;
		border-radius: 6px;
		padding: 0 12px;
		font: inherit;
		background: #ffffff;
		color: #17211b;
	}

	button {
		min-height: 46px;
		border: 1px solid #17211b;
		border-radius: 6px;
		background: #17211b;
		color: #ffffff;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	button:disabled {
		cursor: wait;
		opacity: 0.7;
	}

	.error {
		margin: 0;
		color: #b1222b;
	}
</style>
