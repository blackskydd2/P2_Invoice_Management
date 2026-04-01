export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p style={{ fontSize: '0.85rem' }}>{message}</p>
    </div>
  );
}
