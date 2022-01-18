
import * as React from 'react';
import { Flex, Button, ProgressBar, Txt } from 'rendition';
import { default as styled } from 'styled-components';

const FlashProgressBar = styled(ProgressBar)`
	> div {
		width: 100%;
		height: 12px;
		color: white !important;
		text-shadow: none !important;
		transition-duration: 0s;
		> div {
			transition-duration: 0s;
		}
	}

	width: 100%;
	height: 12px;
	margin-bottom: 6px;
	border-radius: 14px;
	font-size: 16px;
	line-height: 48px;

	background: #2f3033;
`;

interface ProgressButtonProps {
	type: 'decompressing' | 'flashing' | 'verifying';
	active: boolean;
	percentage: number;
	position: number;
	disabled: boolean;
	cancel: (type: string) => void;
	callback: () => void;
	warning?: boolean;
	text?: string
}

const colors = {
	decompressing: '#00aeef',
	flashing: '#da60ff',
	verifying: '#1ac135',
} as const;

const CancelButton = styled(({ type, onClick, ...props }) => {
	const status = type === 'verifying' ? 'Skip' : 'Cancel';
	return (
		<Button plain onClick={() => onClick(status)} {...props}>
			{status}
		</Button>
	);
})`
	font-weight: 600;
	&&& {
		width: auto;
		height: auto;
		font-size: 14px;
	}
`;

interface FlashState {
	active: number;
	failed: number;
	percentage?: number;
	speed: number;
	position: number;
	type?: 'decompressing' | 'flashing' | 'verifying';
}

const  fromFlashState = ({
	type,
	percentage,
	position,
}: Pick<FlashState, 'type' | 'percentage' | 'position'>): {
	status: string;
	position?: string;
} => {
	if (type === undefined) {
		return { status: 'Starting...' };
	} else if (type === 'decompressing') {
		if (percentage == null) {
			return { status: 'Decompressing...' };
		} else {
			return { position: `${percentage}%`, status: 'Decompressing...' };
		}
	} else if (type === 'flashing') {
		if (percentage != null) {
			if (percentage < 100) {
				return { position: `${percentage}%`, status: 'Flashing...' };
			} else {
				return { status: 'Finishing...' };
			}
		} else {
			return {
				status: 'Flashing...',
				position: `${position ? (position.toFixed(2)) : ''}`,
			};
		}
	} else if (type === 'verifying') {
		if (percentage == null) {
			return { status: 'Validating...' };
		} else if (percentage < 100) {
			return { position: `${percentage}%`, status: 'Validating...' };
		} else {
			return { status: 'Finishing...' };
		}
	}
	return { status: 'Failed' };
}

export class ProgressButton extends React.PureComponent<ProgressButtonProps> {
	public render() {
		const percentage = this.props.percentage;
		const warning = this.props.warning;
		const { status, position } = fromFlashState({
			type: this.props.type,
			percentage,
			position: this.props.position,
		});
		const type = this.props.type || 'default';
		if (this.props.active) {
			return (
				<>
					<Flex
						alignItems="baseline"
						justifyContent="space-between"
						width="100%"
						style={{
							marginTop: 42,
							marginBottom: '6px',
							fontSize: 16,
							fontWeight: 600,
						}}
					>
						<Flex>
							<Txt color="#fff">{status}&nbsp;</Txt>
							<Txt color={colors[type]}>{position}</Txt>
						</Flex>
						{type && (
							<CancelButton
								type={type}
								onClick={this.props.cancel}
								color="#00aeef"
							/>
						)}
					</Flex>
					<FlashProgressBar background={colors[type]} value={percentage} />
				</>
			);
		}
		return (
			<Button
				primary={!warning}
				warning={warning}
				onClick={this.props.callback}
				disabled={this.props.disabled}
			>
				{this.props.text}
			</Button>
		);
	}
}
