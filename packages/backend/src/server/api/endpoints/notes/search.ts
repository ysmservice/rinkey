import es from '../../../../db/elasticsearch.js';
import define from '../../define.js';
import { Notes } from '@/models/index.js';
import { In } from 'typeorm';
import config from '@/config/index.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';
import { generateVisibilityQuery } from '../../common/generate-visibility-query.js';
import { generateMutedUserQuery } from '../../common/generate-muted-user-query.js';
import { generateBlockedUserQuery } from '../../common/generate-block-query.js';

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},

	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		query: { type: 'string' },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
		host: { type: 'string', nullable: true },
		userId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
		channelId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
	},
	required: ['query'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	if (es == null) {
		let searchOperator = '&@~';
		const query = makePaginationQuery(Notes.createQueryBuilder('note'), ps.sinceId, ps.untilId);
		const searchModeRegex = /mode:(full|fuzzy|exact) /g;
		const sinceRegex = /since:([0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])) /g;
		const untilRegex = /until:([0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])) /g;
		const hostRegex = /host:([a-zA-Z0-9.-]+) /g;

		if (ps.userId) {
			query.andWhere('note.userId = :userId', { userId: ps.userId });
		} else if (ps.channelId) {
			query.andWhere('note.channelId = :channelId', { channelId: ps.channelId });
		}

		if (searchModeRegex.test(ps.query)) {
			switch (RegExp.$1) {
				case 'fuzzy':
					searchOperator = '&@*';
					break;
				case 'exact':
					searchOperator = '=';
					break;
				default:
					searchOperator = '&@~';
			}
			ps.query = ps.query.replaceAll(searchModeRegex, '');
		}
		if (sinceRegex.test(ps.query)) {
			query.andWhere('note.createdAt > :since', { since: `${RegExp.$1}` });
			ps.query = ps.query.replaceAll(sinceRegex, '');
		}
		if (untilRegex.test(ps.query)) {
			query.andWhere('note.createdAt < :until', { until: `${RegExp.$1} 23:59:59` });
			ps.query = ps.query.replaceAll(untilRegex, '');
		}
		if (hostRegex.test(ps.query)) {
			if (RegExp.$1 === 'local') {
				query.andWhere('note.userHost IS NULL');
			} else {
				query.andWhere('note.userHost = :host', { host: `${RegExp.$1}` });
			}
			ps.query = ps.query.replaceAll(hostRegex, '');
		}

		ps.query = ps.query.replaceAll(/\s\s+/g, ' ');

		query
			.andWhere('note.text ' + searchOperator + ' :q', { q: `${ps.query}` })
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('user.avatar', 'avatar')
			.leftJoinAndSelect('user.banner', 'banner')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('replyUser.avatar', 'replyUserAvatar')
			.leftJoinAndSelect('replyUser.banner', 'replyUserBanner')
			.leftJoinAndSelect('renote.user', 'renoteUser')
			.leftJoinAndSelect('renoteUser.avatar', 'renoteUserAvatar')
			.leftJoinAndSelect('renoteUser.banner', 'renoteUserBanner');

		generateVisibilityQuery(query, me);
		if (me) generateMutedUserQuery(query, me);
		if (me) generateBlockedUserQuery(query, me);

		const notes = await query.take(ps.limit).getMany();

		return await Notes.packMany(notes, me);
	} else {
		const userQuery = ps.userId != null ? [{
			term: {
				userId: ps.userId,
			},
		}] : [];

		const hostQuery = ps.userId == null ?
			ps.host === null ? [{
				bool: {
					must_not: {
						exists: {
							field: 'userHost',
						},
					},
				},
			}] : ps.host !== undefined ? [{
				term: {
					userHost: ps.host,
				},
			}] : []
		: [];

		const result = await es.search({
			index: config.elasticsearch.index || 'misskey_note',
			body: {
				size: ps.limit,
				from: ps.offset,
				query: {
					bool: {
						must: [{
							simple_query_string: {
								fields: ['text'],
								query: ps.query.toLowerCase(),
								default_operator: 'and',
							},
						}, ...hostQuery, ...userQuery],
					},
				},
				sort: [{
					_doc: 'desc',
				}],
			},
		});

		const hits = result.body.hits.hits.map((hit: any) => hit._id);

		if (hits.length === 0) return [];

		// Fetch found notes
		const notes = await Notes.find({
			where: {
				id: In(hits),
			},
			order: {
				id: -1,
			},
		});

		return await Notes.packMany(notes, me);
	}
});
