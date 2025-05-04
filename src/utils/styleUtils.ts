import { hexToRgba } from './colorUtils';

interface StyleConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export const getGradientStyle = (config: StyleConfig) => ({
  background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
});

export const getGradientWithHoverStyle = (config: StyleConfig) => ({
  background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
  boxShadow: `0 10px 20px ${hexToRgba(config.primaryColor, 0.3)}`,
});

export const getIconContainerStyle = (config: StyleConfig) => ({
  background: `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.2)}, ${hexToRgba(config.secondaryColor, 0.2)})`,
  border: `2px solid ${hexToRgba(config.primaryColor, 0.3)}`,
});

export const getCardHoverStyle = (config: StyleConfig) => ({
  boxShadow: `0 20px 25px -5px ${hexToRgba(config.primaryColor, 0.2)}, 0 10px 10px -5px ${hexToRgba(config.secondaryColor, 0.2)}`,
});

export const getPopupStyle = (config: StyleConfig) => ({
  boxShadow: `0 25px 30px -5px ${hexToRgba(config.primaryColor, 0.2)}, 0 15px 15px -5px ${hexToRgba(config.secondaryColor, 0.2)}`,
});

export const getTextGradientStyle = (config: StyleConfig) => ({
  backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
});
