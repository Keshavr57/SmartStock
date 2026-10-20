import { z } from 'zod';

// NSE/BSE tickers: letters, digits, '&', '-', optional exchange suffix (e.g. M&M.NS, BAJAJ-AUTO.NS).
const symbol = z.string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9&-]{1,20}(\.(NS|BO))?$/, 'Invalid stock symbol');

// Quotes and charts may also be requested for indices such as ^NSEI (never tradable).
const quoteSymbol = z.string()
    .trim()
    .toUpperCase()
    .regex(/^\^?[A-Z0-9&-]{1,20}(\.(NS|BO))?$/, 'Invalid symbol');

export const orderSchema = z.object({
    symbol,
    // Accept the client's existing `type` field as an alias for `side`.
    side: z.enum(['BUY', 'SELL']).optional(),
    type: z.enum(['BUY', 'SELL']).optional(),
    quantity: z.number({ invalid_type_error: 'Quantity must be a number' })
        .int('Quantity must be a whole number of shares')
        .positive('Quantity must be at least 1')
        .max(100000, 'Quantity is too large'),
    orderType: z.literal('MARKET', {
        errorMap: () => ({ message: 'Only MARKET orders are supported right now' })
    }).default('MARKET')
}).transform(({ type, side, ...rest }) => ({ ...rest, side: side ?? type }))
    .refine(order => order.side, { message: 'Order side (BUY or SELL) is required', path: ['side'] });

export const watchlistSchema = z.object({ symbol });

export const symbolParamSchema = z.object({ symbol });

export const quoteParamSchema = z.object({ symbol: quoteSymbol });

export const quotesQuerySchema = z.object({
    symbols: z.string().transform(v => v.split(',').map(x => x.trim()).filter(Boolean))
        .pipe(z.array(quoteSymbol).min(1).max(25))
});

export const transactionsQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(200).default(50)
});

// Express middleware: parses `req[source]` with `schema` and replaces it with the parsed value.
export const validate = (schema, source = 'body') => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        const issue = result.error.issues[0];
        return res.status(400).json({
            status: 'error',
            code: 'VALIDATION_ERROR',
            message: issue.message,
            field: issue.path.join('.') || undefined
        });
    }
    req.validated = { ...req.validated, [source]: result.data };
    next();
};
