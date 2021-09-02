import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as http from 'http';
import { dirname } from 'path';
import { env } from 'process';
import { Stream } from 'stream';
import { URL } from 'url';

const CONFIG_FILE_PATH = '/root/.config/balena-etcher/config.json';

const drivesOrder2_3_x = [
	'platform-33800000.pcie-pci-0000:01:00.0-usb-0:2:1.0-scsi-0:0:0:0',
	'platform-xhci-hcd.1.auto-usb-0:1.7:1.0-scsi-0:0:0:0',
	'platform-xhci-hcd.0.auto-usb-0:1.7:1.0-scsi-0:0:0:0',
	'platform-xhci-hcd.1.auto-usb-0:1.5:1.0-scsi-0:0:0:0',
	'platform-xhci-hcd.0.auto-usb-0:1.5:1.0-scsi-0:0:0:0',
	'platform-xhci-hcd.1.auto-usb-0:1.4:1.0-scsi-0:0:0:0',
	'platform-xhci-hcd.0.auto-usb-0:1.4:1.0-scsi-0:0:0:0',
	'platform-xhci-hcd.1.auto-usb-0:1.3:1.0-scsi-0:0:0:0',
	'platform-xhci-hcd.0.auto-usb-0:1.3:1.0-scsi-0:0:0:0',
	'platform-xhci-hcd.1.auto-usb-0:1.2:1.0-scsi-0:0:0:0',
	'platform-xhci-hcd.0.auto-usb-0:1.2:1.0-scsi-0:0:0:0',
	'platform-xhci-hcd.1.auto-usb-0:1.1:1.0-scsi-0:0:0:0',
	'platform-xhci-hcd.0.auto-usb-0:1.1:1.0-scsi-0:0:0:0',
	'platform-33800000.pcie-pci-0000:01:00.0-usb-0:1:1.0-scsi-0:0:0:0',
	'platform-33800000.pcie-pci-0000:01:00.0-usb-0:4:1.0-scsi-0:0:0:0',
	'platform-33800000.pcie-pci-0000:01:00.0-usb-0:3:1.0-scsi-0:0:0:0',
];

const defaultHWConfig = {
	autoSelectAllDrives: true,
	desktopNotifications: false,
	disableExternalLinks: true,
	driveBlacklist: [
		'/dev/mmcblk0rpmb',
		'/dev/mmcblk0',
		'/dev/mmcblk0boot0',
		'/dev/mmcblk0boot1',
	],
	featuredProjectEndpoint: 'nothing://',
	successBannerURL: '',
	fullscreen: true,
	ledsOrder: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
	drivesOrder: drivesOrder2_3_x,
	xrandrArgs: '',
};

const db = {
	// key: hw version
	default: {
		// key: os version
		default: defaultHWConfig
	},
	'2.2.2': {
		default: {
			...defaultHWConfig,
			// xrandrArgs: '-o inverted -x',
			drivesOrder: [
				'platform-xhci-hcd.1.auto-usb-0:1.1.1:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.1.2:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.1.3:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.1.4:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.2.1:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.2.2:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.2.3:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.2.4:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.1.1:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.1.2:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.1.3:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.1.4:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.2.1:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.2.2:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.2.3:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.2.4:1.0-scsi-0:0:0:0',
			],
		},
	},
}

type TMPDB = typeof db;

type HWVersion = keyof TMPDB;

type OSVersion = keyof TMPDB[HWVersion];

interface TypedProcessEnv extends NodeJS.ProcessEnv {
	ETCHER_PRO_VERSION?: HWVersion;
}

const {
	BALENA_SUPERVISOR_ADDRESS,
	BALENA_SUPERVISOR_API_KEY,
	ETCHER_PRO_VERSION = 'default',  // TODO: get etcher pro version from somewhere else
}: TypedProcessEnv = env;

function streamToString(stream: Stream): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: any[] = [];
		stream.on('error', reject);
		stream.on('data', (chunk: any) => {
			chunks.push(chunk);
		});
		stream.on('end', () => {
			resolve(chunks.join(''));
		});
	});
}

function get(url: string | URL, options: http.RequestOptions): Promise<Stream> {
	return new Promise((resolve, reject) => {
		http.get(url, options, resolve).on('error', reject);
	});
}

async function getOsVersion(): Promise<OSVersion> {
	const url = `${BALENA_SUPERVISOR_ADDRESS}/v1/device`;
	const headers = { Authorization: `Bearer ${BALENA_SUPERVISOR_API_KEY}` };
	const response = await get(url, { headers });
	return JSON.parse(await streamToString(response)).os_version.split(' ')[1];
}

async function writeConfigFile(config: any) {
	let currentConfig = {};
	await fs.mkdir(dirname(CONFIG_FILE_PATH), { recursive: true });
	try {
		currentConfig = JSON.parse(await fs.readFile(CONFIG_FILE_PATH, { encoding: 'utf8' }));
	} catch (error) {
	}
	const newConfig = { ...currentConfig, ...config };
	await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2));
}

function zip(...arrays: any[][]): any[][] {
    // @ts-ignore
	return arrays[0].map((_: any, i: string | number) => arrays.map(array => array[i]));
}

async function main() {
	const osVersion = await getOsVersion();
	const hwConfig = db[ETCHER_PRO_VERSION] || db['default'];
	const hwOsConfig = hwConfig[osVersion] || hwConfig['default'];
	const config = { ...defaultHWConfig, ...hwOsConfig };
	const { drivesOrder, ledsOrder, xrandrArgs, ...rest } = config;
	let automountOnFileSelect;
	let ledsMapping;
	if (drivesOrder !== undefined) {
		automountOnFileSelect = drivesOrder[0];
		ledsMapping = Object.fromEntries(zip(drivesOrder, ledsOrder).map(([drive, ledNumber]) => {
			return [drive, ['r', 'g', 'b'].map(color => `led${ledNumber}_${color}`)];
		}));
	}
	await writeConfigFile({ ...rest, ledsMapping, automountOnFileSelect, drivesOrder });
	const xinit = spawn('xinit', [], { stdio: 'inherit', env: { XRANDR_ARGS: xrandrArgs, ...env } });
	xinit.on('close', (code: number | undefined) => {
		process.exitCode = code;
	});
}

main();
