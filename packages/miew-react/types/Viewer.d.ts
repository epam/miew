import { Miew } from 'miew';

declare type ViewerProps = {
  onInit?: (miew: Miew) => void;
};

declare const Viewer: ({ onInit }: ViewerProps) => import('@emotion/react/jsx-runtime').JSX.Element;
export default Viewer;
