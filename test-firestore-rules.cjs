const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');

async function main() {
  const testEnv = await initializeTestEnvironment({
    projectId: "demo-test",
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  });

  const db = testEnv.authenticatedContext('user123', {}).firestore();

  // Mock user doc
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();
    await adminDb.collection('usuarios').doc('user123').set({
      salaoId: 'salao1',
      role: 'admin'
    });
  });

  try {
    console.log("Testing non-existent doc read...");
    await assertSucceeds(db.collection('caixa_status').doc('salao1').get());
    console.log("Success!");
  } catch (e) {
    console.error("Failed:", e);
  }

  process.exit();
}

main();
