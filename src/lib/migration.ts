import { db } from '../lib/firebase';
import { collection, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';

export async function runMigration() {
  const collections = [
    'clientes', 'profissionais', 'servicos', 'agendamentos', 'produtos', 
    'caixa_transacoes', 'caixa_status', 'configuracoes', 'contas_receber', 'movimentacoes', 'notificacoes'
  ];

  console.log('Starting migration...');

  for (const colName of collections) {
    const colRef = collection(db, colName);
    const snapshot = await getDocs(colRef);
    const batch = writeBatch(db);
    let count = 0;

    snapshot.forEach((document) => {
      const data = document.data();
      // If salaoId exists and empresaId is missing, migrate
      if (data.salaoId && !data.empresaId) {
        batch.update(doc(db, colName, document.id), { empresaId: data.salaoId });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Migrated ${count} documents in ${colName}`);
    }
  }

  console.log('Migration completed.');
}
