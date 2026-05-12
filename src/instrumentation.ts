export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamically import the seed script to avoid Edge runtime issues
    const { seedAdmin } = await import('./lib/seed');
    await seedAdmin();
  }
}
