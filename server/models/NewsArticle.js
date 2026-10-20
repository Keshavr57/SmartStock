import mongoose from 'mongoose';

// Every analysed headline is stored so that its real price reaction can be measured later
// and aggregated into per-event-type statistics (see features/news/eventStudy.js).
const newsArticleSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // normalised title, for de-duplication across feeds
    title: { type: String, required: true },
    summary: String,
    link: String,
    source: String,
    publishedAt: { type: Date, required: true },
    symbols: [String],
    scope: { type: String, enum: ['company', 'market'], required: true },
    analysis: {
        score: Number,
        label: { type: String, enum: ['positive', 'negative', 'neutral'] },
        confidence: Number,
        describesMove: Boolean,
        event: {
            type: { type: String },
            label: String,
            direction: Number,
            macro: Boolean
        },
        evidence: [{ _id: false, term: String, weight: Number }]
    },
    reaction: {
        status: { type: String, enum: ['pending', 'done', 'unavailable'], default: 'pending' },
        symbol: String,
        ar1: Number,
        arNext: Number,
        car3: Number,
        reactionDate: String,
        computedAt: Date,
        checkedAt: Date
    }
}, { timestamps: true });

newsArticleSchema.index({ publishedAt: -1 });
newsArticleSchema.index({ 'reaction.status': 1, publishedAt: -1 });
newsArticleSchema.index({ 'analysis.event.type': 1, 'reaction.status': 1 });

export default mongoose.model('NewsArticle', newsArticleSchema);
