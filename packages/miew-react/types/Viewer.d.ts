import { Miew } from 'miew';

declare type ViewerProps = {
  onInit?: (miew: Miew) => void;
  options?: { [key: string]: any };
  theme?: any;
};

declare const Viewer: ({
  onInit,
  options,
  theme,
}: ViewerProps) => import('@emotion/react/jsx-runtime').JSX.Element;
export default Viewer;
