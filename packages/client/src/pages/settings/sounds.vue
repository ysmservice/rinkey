<template>
<div class="_formRoot">
	<FormRange v-model="masterVolume" :min="0" :max="1" :step="0.05" :text-converter="(v) => `${Math.floor(v * 100)}%`" class="_formBlock">
		<template #label>{{ i18n.ts.masterVolume }}</template>
	</FormRange>

	<FormSection>
		<template #label>{{ i18n.ts.sounds }}</template>
		<FormLink v-for="type in Object.keys(sounds)" :key="type" style="margin-bottom: 8px;" @click="edit(type)">
			{{ $t('_sfx.' + type) }}
			<template #suffix>{{ sounds[type].type || i18n.ts.none }}</template>
			<template #suffixIcon><i class="fas fa-chevron-down"></i></template>
		</FormLink>
	</FormSection>

	<FormButton danger class="_formBlock" @click="reset()"><i class="fas fa-redo"></i> {{ i18n.ts.default }}</FormButton>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import FormRange from '@/components/form/range.vue';
import FormButton from '@/components/MkButton.vue';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import * as os from '@/os';
import { ColdDeviceStorage } from '@/store';
import { playFile } from '@/scripts/sound';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const masterVolume = computed({
	get: () => {
		return ColdDeviceStorage.get('sound_masterVolume');
	},
	set: (value) => {
		ColdDeviceStorage.set('sound_masterVolume', value);
	},
});

const volumeIcon = computed(() => masterVolume.value === 0 ? 'fas fa-volume-mute' : 'fas fa-volume-up');

const sounds = ref({
	note: ColdDeviceStorage.get('sound_note'),
	noteMy: ColdDeviceStorage.get('sound_noteMy'),
	notification: ColdDeviceStorage.get('sound_notification'),
	chat: ColdDeviceStorage.get('sound_chat'),
	chatBg: ColdDeviceStorage.get('sound_chatBg'),
	antenna: ColdDeviceStorage.get('sound_antenna'),
	channel: ColdDeviceStorage.get('sound_channel'),
});

const soundsTypes = [
	null,
	'syuilo/up',
	'syuilo/down',
	'syuilo/pope1',
	'syuilo/pope2',
	'syuilo/waon',
	'syuilo/popo',
	'syuilo/triple',
	'syuilo/poi1',
	'syuilo/poi2',
	'syuilo/pirori',
	'syuilo/pirori-wet',
	'syuilo/pirori-square-wet',
	'syuilo/square-pico',
	'syuilo/reverved',
	'syuilo/ryukyu',
	'syuilo/kick',
	'syuilo/snare',
	'syuilo/queue-jammed',
	'aisha/1',
	'aisha/2',
	'aisha/3',
	'noizenecio/kick_gaba',
	'noizenecio/kick_gaba2',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeA_Antenna',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeA_Channel',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeA_Chat',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeA_Note1',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeA_Note2',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeA_Notification',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeA_Send1',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeA_Send2',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeB_Antenna',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeB_Channel',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeB_Chat',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeB_Note1',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeB_Note2',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeB_Notification',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeB_Send',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeC_Antenna',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeC_Channel',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeC_Chat',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeC_Note',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeC_Notification',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeC_Send',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeD_Antenna',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeD_Channel',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeD_Chat',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeD_Note',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeD_Notification',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeD_Send',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeE_Antenna',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeE_Channel',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeE_Chat',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeE_Note',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeE_Notification',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeE_Send',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeF_Antenna',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeF_Channel',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeF_Chat',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeF_Note',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeF_Notification',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeF_Send',
	'Copyright_Misskey.io/ThinaticSystem/mata_hazukashiikoto_itteru',
	'Copyright_Misskey.io/ThinaticSystem/akemashite_omedetou_gozaimasu',
	'Copyright_Misskey.io/ThinaticSystem/bibi',
	'Copyright_Misskey.io/ThinaticSystem/doya1',
	'Copyright_Misskey.io/ThinaticSystem/doya2',
	'Copyright_Misskey.io/ThinaticSystem/doya3',
	'Copyright_Misskey.io/ThinaticSystem/gege_ltu_win3.1',
	'Copyright_Misskey.io/ThinaticSystem/hekuchi',
	'Copyright_Misskey.io/ThinaticSystem/moresou',
	'Copyright_Misskey.io/ThinaticSystem/muzumuzu_suru',
	'Copyright_Misskey.io/ThinaticSystem/nsho',
	'Copyright_Misskey.io/ThinaticSystem/pepo',
	'Copyright_Misskey.io/ThinaticSystem/picco_n',
	'Copyright_Misskey.io/ThinaticSystem/tenor_sax',
	'Copyright_Misskey.io/ThinaticSystem/topo',
	'Copyright_Misskey.io/ThinaticSystem/tsukapekepinpa',
	'Copyright_Misskey.io/ThinaticSystem/vun_clean',
	'Copyright_Misskey.io/ThinaticSystem/vun_dirty',
	'Copyright_Misskey.io/ThinaticSystem/wa',
	'Copyright_Misskey.io/ThinaticSystem/yonderuzo1',
	'Copyright_Misskey.io/ThinaticSystem/yonderuzo2',
	'Copyright_Misskey.io/ThinaticSystem/yonderuzo3',
];

async function edit(type) {
	const { canceled, result } = await os.form(i18n.t('_sfx.' + type), {
		type: {
			type: 'enum',
			enum: soundsTypes.map(x => ({
				value: x,
				label: x == null ? i18n.ts.none : x,
			})),
			label: i18n.ts.sound,
			default: sounds.value[type].type,
		},
		volume: {
			type: 'range',
			min: 0,
			max: 1,
			step: 0.05,
			textConverter: (v) => `${Math.floor(v * 100)}%`,
			label: i18n.ts.volume,
			default: sounds.value[type].volume,
		},
		listen: {
			type: 'button',
			content: i18n.ts.listen,
			action: (_, values) => {
				playFile(values.type, values.volume);
			},
		},
	});
	if (canceled) return;

	const v = {
		type: result.type,
		volume: result.volume,
	};

	ColdDeviceStorage.set('sound_' + type, v);
	sounds.value[type] = v;
}

function reset() {
	for (const sound of Object.keys(sounds.value)) {
		const v = ColdDeviceStorage.default['sound_' + sound];
		ColdDeviceStorage.set('sound_' + sound, v);
		sounds.value[sound] = v;
	}
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.sounds,
	icon: 'fas fa-music',
});
</script>
