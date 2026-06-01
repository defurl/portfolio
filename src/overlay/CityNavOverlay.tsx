import { useCityStore } from '../lib/stores/cityStore';
import styles from './BackToDesk.module.css';

// Phase 4D / Redesign UI Overlay
// Renders an stackable interactive button bottom-left (above "back to desk")
// allowing visitors to toggle between Skyline Orbit overview and walking Street POV modes.

export function CityNavOverlay() {
  const mode = useCityStore((s) => s.navigationMode);
  const setMode = useCityStore((s) => s.setNavigationMode);

  const isStreet = mode === 'street';

  const toggleMode = () => {
    setMode(isStreet ? 'orbit' : 'street');
  };

  return (
    <button
      type="button"
      className={styles.back}
      style={{ bottom: '3.2rem' }} // Offset above "back to desk" button
      onClick={toggleMode}
    >
      {isStreet ? '← return to overview' : '← explore street POV'}
    </button>
  );
}
