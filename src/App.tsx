import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { TextRoute } from './routes/TextRoute';
import { LampPlaceholder } from './overlay/LampPlaceholder';
import { useReducedMotion } from './lib/motion/reducedMotion';
import { useSceneStore } from './lib/stores/sceneStore';

// /text is the only statically imported route — it must stay in the entry chunk
// so visitors hitting the no-WebGL fallback never pull R3F/three/drei.
// DeskRoute/CityRoute/NnRoute are all behind React.lazy and code-split per scene.
const DeskRoute = lazy(() => import('./routes/DeskRoute').then(m => ({ default: m.DeskRoute })));
const CityRoute = lazy(() => import('./routes/CityRoute').then(m => ({ default: m.CityRoute })));
const NnRoute = lazy(() => import('./routes/NnRoute').then(m => ({ default: m.NnRoute })));

export function App() {
  // Single subscription site for the media query — descendants read from sceneStore.
  const reduced = useReducedMotion();
  const setReduced = useSceneStore(s => s.setPrefersReducedMotion);
  useEffect(() => {
    setReduced(reduced);
  }, [reduced, setReduced]);

  return (
    <div className="grain" data-reduced-motion={reduced ? 'true' : 'false'}>
      <Suspense fallback={<LampPlaceholder />}>
        <Routes>
          <Route path="/" element={<DeskRoute />} />
          <Route path="/city" element={<CityRoute />} />
          <Route path="/nn" element={<NnRoute />} />
          <Route path="/text" element={<TextRoute />} />
        </Routes>
      </Suspense>
    </div>
  );
}
