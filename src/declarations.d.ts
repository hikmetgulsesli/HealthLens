declare module 'react-native-vector-icons/MaterialIcons' {
  import {Icon} from 'react-native-vector-icons';
  export default Icon;
}

declare module '@env' {
  export const KIMI_API_KEY: string;
  export const GEMINI_API_KEY: string;
  export const MINIMAX_API_KEY: string;
  export const AI_PROXY_URL: string;
  export const AI_PROXY_TOKEN: string;
}