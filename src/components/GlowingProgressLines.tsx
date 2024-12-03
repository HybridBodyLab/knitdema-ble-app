import React from 'react';

export interface LinePosition {
	start: {
		top: string;
		left: string;
	};
	end: {
		top: string;
		left: string;
	};
	rotation?: number;
}

interface GlowingProgressLinesProps {
	characteristics: Record<string, number>;
	positions: Record<string, LinePosition[]>;
}

// const widthScalingFactor = window.innerWidth/412;
// const heightScalingFactor = window.innerHeight/915;
const GlowingProgressLines: React.FC<GlowingProgressLinesProps> = ({ characteristics, positions }) => {
	return (
		<div style={styles.container}>
			{Object.entries(characteristics).map(([key, value]) => {
				if (!positions[key] || value == -1) return null;
				const position = positions[key][value]
				const startLeft = parseInt(position.start.left);
				const endLeft = parseInt(position.end.left);
				const width = endLeft - startLeft;
				return (
					<div
						key={`${key}-${value}`}
						style={{
							...styles.line,
							width: `${width}px`,
							top: `${position.start.top}`,
							left: `${position.start.left}`,
							transform: `rotate(${position.rotation ? position.rotation : 0}deg)`,
							transformOrigin: "left center",
							backgroundColor: "#ab3a3d",
						}}
					>
						<div
							style={{
								...styles.glow,
								width: `100%`,
							}}
						/>
					</div>
				)
			})}
		</div>
	);
};

// const getColorForCharacteristic = (characteristic: string): string => {
// 	const colors: { [key: string]: string } = {
// 		palm: '#FF5733',
// 		index: '#33FF57',
// 		thumb: '#CF5E6FFF',
// 		ring: '#FF33F1',
// 		pinky: '#33FFF1',
// 		middle: '#F1FF33',
// 	};
// 	return colors[characteristic] || '#FFFFFF';
// };

const styles: { [key: string]: React.CSSProperties } = {
	container: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	line: {
		position: 'absolute',
		height: '8px',
		borderRadius: '4px',
		overflow: 'hidden',
	},
	glowContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		height: '100%',
		overflow: 'hidden',
	},
	glow: {
		position: 'absolute',
		top: 0,
		left: '-50%',
		right: '-50%',
		bottom: 0,
		background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)',
		animation: 'moveGlow 2s linear infinite',
	},
};

const keyframes = `
  @keyframes moveGlow {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

const styleElement = document.createElement('style');
styleElement.textContent = keyframes;
document.head.appendChild(styleElement);

export default GlowingProgressLines;