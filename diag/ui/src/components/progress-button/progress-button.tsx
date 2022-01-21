
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

type TypeColors = {
	decompressing: string,
	flashing: string,
	verifying: string
}

const colors: TypeColors = {
	decompressing: '#00aeef',
	flashing: '#da60ff',
	verifying: '#1ac135',
} as const;

interface ProgressButtonProps {
	progressText: string;
	type: keyof TypeColors;
	active: boolean;
	percentage: number;
	position: number;
	disabled: boolean;
	cancel: (type: string) => void;
	callback: () => void;
	warning?: boolean;
	text?: string
}

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
	type?: keyof TypeColors;
}


export class ProgressButton extends React.PureComponent<ProgressButtonProps> {
	public render() {
		const percentage = this.props.percentage;
		const warning = this.props.warning;
		const { status, position } = { 
			status: this.props.progressText, 
			position: this.props.position 
		} 
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
							<Txt color="#2a506f">{status}&nbsp;</Txt>
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
