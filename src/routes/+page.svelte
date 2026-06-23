<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Perbasi Tower Management</title>
	<meta name="description" content="Perbasi Tower Management administration application." />
</svelte:head>

<main>
	<section>
		<p class="eyebrow">PERBASI</p>
		<h1>Perbasi Tower Management</h1>
		<p>
			SvelteKit application scaffold with a development SQLite database and production PostgreSQL
			database configuration.
		</p>
		<a href={resolve('/api/health/db')}>Check database health</a>
	</section>
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

	section {
		width: min(720px, 100%);
	}

	.eyebrow {
		margin: 0 0 12px;
		color: #b1222b;
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0;
	}

	h1 {
		margin: 0;
		font-size: 3rem;
		line-height: 0.95;
		letter-spacing: 0;
	}

	p {
		max-width: 560px;
		font-size: 1.08rem;
		line-height: 1.7;
	}

	a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0 18px;
		border: 1px solid #17211b;
		border-radius: 6px;
		color: #17211b;
		font-weight: 700;
		text-decoration: none;
	}

	@media (min-width: 720px) {
		h1 {
			font-size: 5.5rem;
		}
	}
</style>
