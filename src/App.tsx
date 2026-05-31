import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { TextRoute } from './routes/TextRoute';
import { LampPlaceholder } from './overlay/LampPlaceholder';
import { NnPlaceholder } from './overlay/NnPlaceholder';
import { SceneFade } from './overlay/SceneFade';
import { useReducedMotion } from './lib/motion/reducedMotion';
import { useIsMobile } from './lib/motion/useMediaQuery';
import { useSceneStore } from './lib/stores/sceneStore';

// /text is the only statically imported route — it must stay in the entry chunk
// so visitors hitting the no-WebGL fallback never pull R3F/three/drei.
// DeskRoute/CityRoute/NnRoute are all behind React.lazy and code-split per scene.
const DeskRoute = lazy(() => import('./routes/DeskRoute').then(m => ({ default: m.DeskRoute })));
const CityRoute = lazy(() => import('./routes/CityRoute').then(m => ({ default: m.CityRoute })));
const NnRoute = lazy(() => import('./routes/NnRoute').then(m => ({ default: m.NnRoute })));
const DebugReplayRoute = lazy(() =>
  import('./routes/DebugReplayRoute').then(m => ({ default: m.DebugReplayRoute })),
);

export function App() {
  // Single subscription site for media queries — descendants read from sceneStore.
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const setReduced = useSceneStore(s => s.setPrefersReducedMotion);
  const setIsMobile = useSceneStore(s => s.setIsMobile);
  useEffect(() => {
    setReduced(reduced);
  }, [reduced, setReduced]);
  useEffect(() => {
    setIsMobile(mobile);
  }, [mobile, setIsMobile]);

  return (
    <div
      className="grain"
      data-reduced-motion={reduced ? 'true' : 'false'}
      data-mobile={mobile ? 'true' : 'false'}
    >
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<LampPlaceholder />}>
              <DeskRoute />
            </Suspense>
          }
        />
        <Route
          path="/city"
          element={
            <Suspense fallback={<LampPlaceholder />}>
              <CityRoute />
            </Suspense>
          }
        />
        <Route
          path="/nn"
          element={
            <Suspense fallback={<NnPlaceholder />}>
              <NnRoute />
            </Suspense>
          }
        />
        <Route path="/text" element={<TextRoute />} />
        <Route
          path="/debug/replay"
          element={
            <Suspense fallback={<LampPlaceholder />}>
              <DebugReplayRoute />
            </Suspense>
          }
        />
      </Routes>
      <SceneFade />
    </div>
  );
}
