/**
 * Languages Loader
 */

import * as fs from 'node:fs';
import * as yaml from 'js-yaml';

const merge = (...args) => args.reduce((a, c) => {
	for (const [k, v] of Object.entries(c)) {
		if (typeof v === 'object' && typeof a[k] === 'object') {
			a[k] = merge(a[k], v);
		} else {
			a[k] = v;
		}
	}
	return a;
}, {});

const languages = [
	'ar-SA',
	'cs-CZ',
	'da-DK',
	'de-DE',
	'en-US',
	'es-ES',
	'fr-FR',
	'id-ID',
	'it-IT',
	'ja-JP',
	'ja-KS',
	'kab-KAB',
	'kn-IN',
	'ko-KR',
	'nl-NL',
	'no-NO',
	'pl-PL',
	'pt-PT',
	'ru-RU',
	'sk-SK',
	'th-TH',
	'ug-CN',
	'uk-UA',
	'vi-VN',
	'zh-CN',
	'zh-TW',
];

const primaries = {
	'en': 'US',
	'ja': 'JP',
	'zh': 'CN',
};

// 何故か文字列にバックスペース文字が混入することがあり、YAMLが壊れるので取り除く
const clean = (text) => text.replace(new RegExp(String.fromCodePoint(0x08), 'g'), '');

export function build() {
	const metaUrl = import.meta.url;
	const locales = languages.reduce((a, c) => (a[c] = yaml.load(clean(fs.readFileSync(new URL(`${c}.yml`, metaUrl), 'utf-8'))) || {}, a), {});

	// 空文字列が入ることがあり、フォールバックが動作しなくなるのでプロパティごと消す
	const removeEmpty = (obj) => {
		for (const [k, v] of Object.entries(obj)) {
			if (v === '') {
				delete obj[k];
			} else if (typeof v === 'object') {
				removeEmpty(v);
			}
		}
		return obj;
	};
	removeEmpty(locales);

	return Object.entries(locales)
		.reduce((a, [k, v]) => (a[k] = (() => {
			const [lang] = k.split('-');
			switch (k) {
				case 'ja-JP': return v;
				case 'ja-KS':
				case 'en-US': return merge(locales['ja-JP'], v);
				default: return merge(
					locales['ja-JP'],
					locales['en-US'],
					locales[`${lang}-${primaries[lang]}`] ?? {},
					v
				);
			}
		})(), a), {});
}

export default build();
