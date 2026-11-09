import React from 'react';
import { KindMindsMap } from '../maps/KindMindsMap';

interface DisasterMapViewerProps {
  panel?: 'helper' | 'needer';
}

export const DisasterMapViewer: React.FC<DisasterMapViewerProps> = ({ panel = 'needer' }) => {
  return <KindMindsMap panel={panel} />;
};
