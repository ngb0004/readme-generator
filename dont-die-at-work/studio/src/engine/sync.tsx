import {useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {continueRender, delayRender, useCurrentFrame} from 'remotion';

/**
 * Holds the screenshot until WebGL has actually drawn this frame.
 * The canvas renders on demand a frame after React commits; without this a
 * capture can land on the previous frame's pixels.
 */
export const FrameSync: React.FC = () => {
  const frame = useCurrentFrame();
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const handle = delayRender(`three frame ${frame}`);
    invalidate();
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => continueRender(handle));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      continueRender(handle);
    };
  }, [frame, invalidate]);
  return null;
};
