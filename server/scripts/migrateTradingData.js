// One-off migration to the single-ledger trading model.
//   - moves users.transactions (embedded) into the transactions collection
//   - normalises holding symbols to the NSE suffix and drops invalid holdings
//   - drops the legacy portfolios / virtualportfolios collections (with --drop-legacy)
//
// Usage: node scripts/migrateTradingData.js            (dry run, prints what would change)
//        node scripts/migrateTradingData.js --apply    (writes changes)
import 'dotenv/config';
import mongoose from 'mongoose';
import { normalizeSymbol } from '../features/stocks/price.service.js';

const APPLY = process.argv.includes('--apply');
const DROP_LEGACY = process.argv.includes('--drop-legacy');
const FEE_RATE = 0.001;

const round2 = (n) => Math.round(n * 100) / 100;

async function main() {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'SmartStock' });
    const db = mongoose.connection.db;
    const users = db.collection('users');
    const ledger = db.collection('transactions');

    console.log(APPLY ? '⚠️  APPLY mode: writing changes' : 'Dry run: no changes will be written');

    let migratedTx = 0;
    let fixedUsers = 0;
    const anomalies = [];

    for await (const user of users.find({})) {
        const legacy = Array.isArray(user.transactions) ? user.transactions : [];
        const docs = legacy
            .filter(t => t && t.symbol && t.quantity > 0 && t.price > 0 && ['BUY', 'SELL'].includes(t.type))
            .map(t => {
                const totalAmount = round2(t.quantity * t.price);
                const fees = round2(totalAmount * FEE_RATE);
                return {
                    userId: user._id,
                    symbol: normalizeSymbol(t.symbol),
                    side: t.type,
                    orderType: 'MARKET',
                    quantity: t.quantity,
                    price: t.price,
                    totalAmount,
                    fees,
                    netAmount: t.type === 'BUY' ? -round2(totalAmount + fees) : round2(totalAmount - fees),
                    realizedPnL: null,
                    balanceAfter: null,
                    priceSource: 'legacy',
                    executedAt: t.date || user.updatedAt || new Date()
                };
            });
        if (legacy.length !== docs.length) {
            anomalies.push(`${user.email}: ${legacy.length - docs.length} invalid legacy transactions skipped`);
        }

        const holdings = Array.isArray(user.portfolio) ? user.portfolio : [];
        const cleanHoldings = holdings
            .filter(h => h && h.symbol && Number.isInteger(h.quantity) && h.quantity > 0 && h.avgPrice > 0)
            .map(h => ({ ...h, symbol: normalizeSymbol(h.symbol) }));
        if (cleanHoldings.length !== holdings.length) {
            anomalies.push(`${user.email}: ${holdings.length - cleanHoldings.length} invalid holdings removed`);
        }
        if (typeof user.virtualBalance !== 'number' || user.virtualBalance < 0 || user.virtualBalance > 10_000_000) {
            anomalies.push(`${user.email}: suspicious balance ₹${user.virtualBalance} (left unchanged; reset manually if needed)`);
        }

        const needsUpdate = legacy.length > 0 || cleanHoldings.length !== holdings.length
            || cleanHoldings.some((h, i) => h.symbol !== holdings[i]?.symbol);
        if (!needsUpdate) continue;

        fixedUsers++;
        migratedTx += docs.length;
        if (APPLY) {
            if (docs.length > 0) await ledger.insertMany(docs);
            await users.updateOne(
                { _id: user._id },
                { $set: { portfolio: cleanHoldings }, $unset: { transactions: '' }, $inc: { __v: 1 } }
            );
        }
    }

    console.log(`Users to update: ${fixedUsers}`);
    console.log(`Legacy transactions to move: ${migratedTx}`);
    anomalies.forEach(a => console.log(`  ! ${a}`));

    if (DROP_LEGACY) {
        for (const name of ['portfolios', 'virtualportfolios']) {
            const exists = await db.listCollections({ name }).hasNext();
            if (!exists) continue;
            console.log(`${APPLY ? 'Dropping' : 'Would drop'} legacy collection: ${name}`);
            if (APPLY) await db.dropCollection(name);
        }
    }

    await mongoose.disconnect();
}

main().catch(async (error) => {
    console.error('Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
});
