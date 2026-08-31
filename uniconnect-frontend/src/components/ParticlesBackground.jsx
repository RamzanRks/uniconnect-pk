import { Particles } from './fx';

const ParticlesBackground = ({ children, color = '#6366f1', count = 80 }) => (
  <>
    <div className="fixed inset-0 pointer-events-none z-0">
      <Particles color={color} count={count} interactive={true} />
    </div>
    <div className="relative z-10">{children}</div>
  </>
);

export default ParticlesBackground;