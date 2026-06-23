<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Dashboard | Perbasi Tower Management</title>
</svelte:head>

<main>
	<section>
		<p class="eyebrow">MANAGEMENT</p>
		<h1>Dashboard</h1>
		<dl>
			<div>
				<dt>Email</dt>
				<dd>{data.actor.user.email}</dd>
			</div>
			<div>
				<dt>Role</dt>
				<dd>{data.actor.user.role}</dd>
			</div>
		</dl>
	</section>
</main>

<style>
	main {
		min-height: 100vh;
		padding: 32px;
		background: #f6f7f4;
		color: #17211b;
	}

	section {
		width: min(960px, 100%);
		margin: 0 auto;
	}

	.eyebrow {
		margin: 0 0 12px;
		color: #b1222b;
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0;
	}

	h1 {
		margin: 0 0 24px;
		font-size: 3rem;
		line-height: 1;
		letter-spacing: 0;
	}

	dl {
		display: grid;
		gap: 12px;
		margin: 0;
	}

	div {
		display: grid;
		gap: 4px;
		padding-block: 14px;
		border-bottom: 1px solid #d9ddd5;
	}

	dt {
		font-weight: 700;
		color: #4d5a50;
	}

	dd {
		margin: 0;
	}
</style>
