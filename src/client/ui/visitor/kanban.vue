<template>
<div class="rwqkcmrc" :style="{ backgroundImage: transparent ? 'none' : `url(${ $instance.backgroundImageUrl })` }">
	<div class="back" :class="{ transparent }"></div>
	<div class="contents">
		<div class="wrapper">
			<h1 v-if="meta" :class="{ full }">
				<MkA to="/" class="link"><img class="logo" v-if="meta.logoImageUrl" :src="meta.logoImageUrl"><span v-else class="text">{{ instanceName }}</span></MkA>
			</h1>
			<template v-if="full">
				<div class="about" v-if="meta">
					<div class="desc" v-html="meta.description || $ts.introMisskey"></div>
				</div>
				<div class="action">
					<button class="_buttonPrimary" @click="signup()">{{ $ts.signup }}</button>
					<button class="_button" @click="signin()">{{ $ts.login }}</button>
				</div>
				<div class="announcements panel">
					<header>{{ $ts.announcements }}</header>
					<MkPagination :pagination="announcements" #default="{items}" class="list">
						<section class="item" v-for="(announcement, i) in items" :key="announcement.id">
							<div class="title">{{ announcement.title }}</div>
							<div class="content">
								<Mfm :text="announcement.text"/>
								<img v-if="announcement.imageUrl" :src="announcement.imageUrl"/>
							</div>
						</section>
					</MkPagination>
				</div>
				<div class="powered-by" v-if="poweredBy">
					<b><MkA to="/">{{ host }}</MkA></b>
					<small>Powered by <a href="https://github.com/misskey-dev/misskey" target="_blank">Misskey</a></small>
				</div>
			</template>
		</div>
	</div>

	<div class="tosvideo-container" v-if="tosVideo">
		<div class="tosvideo-play" v-if="!tosVideoPlaying" @click="playTos">
			<p>クリックして利用規約を確認<br>※音が出ます</p>
			<span>こちらの動画を確認すると登録が可能になります</span>
		</div>
		<video id="tos" src="https://dl.misskey.io/tos.mp4" playsinline></video>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { host, instanceName } from '@client/config';
import * as os from '@client/os';
import MkPagination from '@client/components/ui/pagination.vue';
import XSigninDialog from '@client/components/signin-dialog.vue';
import XSignupDialog from '@client/components/signup-dialog.vue';
import MkButton from '@client/components/ui/button.vue';

export default defineComponent({
	components: {
		MkPagination,
		MkButton,
	},

	props: {
		full: {
			type: Boolean,
			required: false,
			default: false,
		},
		transparent: {
			type: Boolean,
			required: false,
			default: false,
		},
		poweredBy: {
			type: Boolean,
			required: false,
			default: false,
		},
	},

	data() {
		return {
			host,
			instanceName,
			pageInfo: null,
			meta: null,
			tosVideo: false,
			tosVideoPlaying: false,
			narrow: window.innerWidth < 1280,
			announcements: {
				endpoint: 'announcements',
				limit: 10,
			},
		};
	},

	created() {
		os.api('meta', { detail: true }).then(meta => {
			this.meta = meta;
		});
	},

	methods: {
		signin() {
			os.popup(XSigninDialog, {
				autoSet: true
			}, {}, 'closed');
		},

		signup() {
			this.tosVideo = true;
			setTimeout(() => {
				const video = document.getElementById('tos');
				video.addEventListener('ended', () => {
					console.log('tos end');
					this.tosVideo = false;
					os.popup(XSignupDialog, {
						autoSet: true
					}, {}, 'closed');
				});
			}, 100);
		},

		playTos() {
			const video = document.getElementById('tos');
			video.play();
			this.tosVideoPlaying = true;
		}
	}
});
</script>

<style lang="scss" scoped>
.rwqkcmrc {
	position: relative;
	text-align: center;
	background-position: center;
	background-size: cover;
	// TODO: パララックスにしたい

	> .back {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.3);

		&.transparent {
			-webkit-backdrop-filter: var(--blur, blur(12px));
			backdrop-filter: var(--blur, blur(12px));
		}
	}

	> .contents {
		position: relative;
		z-index: 1;
		height: inherit;
		overflow: auto;

		> .wrapper {
			max-width: 380px;
			padding: 0 16px;
			box-sizing: border-box;
			margin: 0 auto;

			> .panel {
				-webkit-backdrop-filter: var(--blur, blur(8px));
				backdrop-filter: var(--blur, blur(8px));
				background: rgba(0, 0, 0, 0.5);
				border-radius: var(--radius);

				&, * {
					color: #fff !important;
				}
			}

			> h1 {
				display: block;
				margin: 0;
				padding: 32px 0 32px 0;
				color: #fff;

				&.full {
					padding: 64px 0 0 0;

					> .link {
						> ::v-deep(.logo) {
							max-height: 130px;
						}
					}
				}

				> .link {
					display: block;

					> ::v-deep(.logo) {
						vertical-align: bottom;
						max-height: 100px;
					}
				}
			}

			> .about {
				display: block;
				margin: 24px 0;
				text-align: center;
				box-sizing: border-box;
				text-shadow: 0 0 8px black;
				color: #fff;
			}

			> .action {
				> button {
					display: block;
					width: 100%;
					padding: 10px;
					box-sizing: border-box;
					text-align: center;
					border-radius: 999px;

					&._button {
						background: var(--panel);
					}

					&:first-child {
						margin-bottom: 16px;
					}
				}
			}

			> .announcements {
				margin: 32px 0;
				text-align: left;

				> header {
					padding: 12px 16px;
					border-bottom: solid 1px rgba(255, 255, 255, 0.5);
				}

				> .list {
					max-height: 300px;
					overflow: auto;

					> .item {
						padding: 12px 16px;

						& + .item {
							border-top: solid 1px rgba(255, 255, 255, 0.5);
						}

						> .title {
							font-weight: bold;
						}

						> .content {
							> img {
								max-width: 100%;
							}
						}
					}
				}
			}

			> .powered-by {
				padding: 28px;
				font-size: 14px;
				text-align: center;
				border-top: 1px solid rgba(255, 255, 255, 0.5);
				color: #fff;

				> small {
					display: block;
					margin-top: 8px;
					opacity: 0.5;
				}
			}
		}
	}
}

.tosvideo-container {
	position: fixed;
	z-index: 99999;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: #fff;

	> .tosvideo-play {
		width: 95vw;
		max-width: 360px;
		height: 130px;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		margin: auto;
		position: absolute;
		text-align: center;
		background-color: var(--accent);
		padding: 10px 20px;
		border-radius: 130px;
		color: var(--fgHighlighted);
		cursor: pointer;

		> p {
			font-size: 1.25rem;
			font-weight: bold;
		}

		> span {
			font-size: 0.75rem;
		}
	}

	> #tos {
		height: 100%;
		width: 100%;
		pointer-events: none;
	}
}
</style>
